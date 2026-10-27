import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { systemClock, type Clock, type Cycle, type Snapshot } from './domain';

const DAY = 86_400_000;
const RETENTION = 90 * DAY;
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_OBSERVATIONS = 12_000;

class InvalidJournalError extends Error {}

function journalName(name: string) {
  const match = /^([a-f0-9]{64})\.(\d{4}-\d{2}-\d{2})\.[a-f0-9-]{36}\.json(?:\.[a-f0-9-]{36}\.tmp|\.corrupt)?$/.exec(name);
  if (!match) return;
  const day = Date.parse(match[2]!);
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== match[2]) return;
  return { identity: match[1]!, day, isJournal: name.endsWith('.json') };
}

export interface Observation {
  at: number;
  used: number;
  total?: number;
  start: number;
  end: number;
}

export function historyIdentity(provider: string, origin: string, accountId: string): string {
  return createHash('sha256').update(JSON.stringify([provider, origin, accountId])).digest('hex');
}

function isObservation(value: unknown): value is Observation {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  const finite = (key: string) => typeof item[key] === 'number' && Number.isFinite(item[key]);
  const timestamp = (key: string) => finite(key) && Number.isFinite(new Date(Number(item[key])).getTime());
  return timestamp('at') && finite('used') && timestamp('start') && timestamp('end') &&
    Number(item.used) >= 0 && Number(item.start) <= Number(item.at) && Number(item.at) < Number(item.end) &&
    Number(item.end) - Number(item.start) <= 32 * DAY &&
    (item.total === undefined || (finite('total') && Number(item.total) > 0));
}

export function retainObservations(items: Observation[], now: number): Observation[] {
  const unique = new Map<number, Observation>();
  for (const item of items) {
    if (isObservation(item) && item.at >= now - RETENTION && item.at <= now) {
      unique.set(item.at, { at: item.at, used: item.used, total: item.total, start: item.start, end: item.end });
    }
  }
  return [...unique.values()].sort((a, b) => a.at - b.at).slice(-MAX_OBSERVATIONS);
}

export function observation(snapshot: Snapshot): Observation | undefined {
  if (snapshot.kind === 'unavailable' || !snapshot.cycle) return;
  const item = {
    at: snapshot.asOf, used: snapshot.used,
    total: snapshot.kind === 'bounded' ? snapshot.total : undefined,
    start: snapshot.cycle.start, end: snapshot.cycle.end,
  };
  return isObservation(item) ? item : undefined;
}

export class HistoryStore {
  private readonly pending = new Map<string, Promise<Observation[]>>();
  private writer = randomUUID();
  constructor(private readonly directory: string, private readonly clock: Clock = systemClock) {}

  private validateIdentity(identity: string) {
    if (!/^[a-f0-9]{64}$/.test(identity)) throw new Error('Invalid history identity');
  }

  async latestFile(identity: string): Promise<string | undefined> {
    this.validateIdentity(identity);
    let names: string[];
    try { names = await readdir(this.directory); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    const journals = [];
    for (const name of names) {
      const journal = journalName(name);
      if (!journal?.isJournal || journal.identity !== identity) continue;
      const file = join(this.directory, name);
      try {
        const metadata = await stat(file);
        if (metadata.isFile()) journals.push({ file, day: journal.day, modified: metadata.mtimeMs });
      } catch (error) {
        // Retention or another window can remove a journal after the directory read.
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
    journals.sort((a, b) => b.day - a.day || b.modified - a.modified || a.file.localeCompare(b.file));
    return journals[0]?.file;
  }

  private async readFile(file: string, now: number): Promise<Observation[]> {
    try {
      if ((await stat(file)).size > MAX_FILE_BYTES) throw new InvalidJournalError('History file is too large');
      const body = await readFile(file);
      if (body.byteLength > MAX_FILE_BYTES) throw new InvalidJournalError('History file is too large');
      let data: unknown;
      try { data = JSON.parse(body.toString('utf8')); }
      catch { throw new InvalidJournalError('Invalid history JSON'); }
      if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1 ||
          !('observations' in data) || !Array.isArray(data.observations)) throw new InvalidJournalError('Unsupported history');
      return retainObservations(data.observations.filter(isObservation), now);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  async prune(now: number): Promise<void> {
    let files: string[];
    try { files = await readdir(this.directory); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    for (const name of files) {
      const journal = journalName(name);
      if (!journal || journal.day + DAY >= now - RETENTION) continue;
      try { await unlink(join(this.directory, name)); }
      catch {
        // Another window can remove a journal, or Windows can keep it locked.
        // Continue maintenance; inaccessible files are retried on the next daily pass.
      }
    }
  }

  async read(identity: string, now: number, cycle: Cycle): Promise<Observation[]> {
    this.validateIdentity(identity);
    let files: string[];
    try { files = await readdir(this.directory); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const items: Observation[] = [];
    for (const name of files.sort()) {
      const journal = journalName(name);
      if (!journal?.isJournal || journal.identity !== identity || journal.day >= cycle.end ||
          journal.day + DAY <= cycle.start || journal.day + DAY < now - RETENTION) continue;
      const file = join(this.directory, name);
      try {
        const observations = await this.readFile(file, now);
        items.push(...observations.filter(item => item.start === cycle.start && item.end === cycle.end));
      } catch (error) {
        // Keep malformed journals intact without hiding real storage failures.
        if (!(error instanceof InvalidJournalError)) throw error;
      }
    }
    return retainObservations(items, now);
  }

  append(identity: string, item: Observation): Promise<Observation[]> {
    const previous = this.pending.get(identity) ?? Promise.resolve([]);
    const next = previous.catch(() => []).then(() => this.write(identity, item));
    this.pending.set(identity, next);
    void next.finally(() => {
      if (this.pending.get(identity) === next) this.pending.delete(identity);
    }).catch(() => {});
    return next;
  }

  private async write(identity: string, item: Observation): Promise<Observation[]> {
    this.validateIdentity(identity);
    if (!isObservation(item)) throw new Error('Invalid observation');
    const now = Math.max(item.at, this.clock.now().getTime());
    const day = new Date(item.at).toISOString().slice(0, 10);
    let file = join(this.directory, `${identity}.${day}.${this.writer}.json`);
    await mkdir(this.directory, { recursive: true });
    let saved: Observation[];
    try { saved = await this.readFile(file, now); }
    catch (error) {
      if (!(error instanceof InvalidJournalError)) throw error;
      // A new private journal preserves the damaged file and avoids a shared write lock.
      this.writer = randomUUID();
      file = join(this.directory, `${identity}.${day}.${this.writer}.json`);
      saved = [];
    }
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      const items = retainObservations([...saved, item], now);
      await writeFile(temporary, JSON.stringify({ version: 1, observations: items }), { flag: 'wx' });
      await rename(temporary, file);
      return await this.read(identity, now, { start: item.start, end: item.end });
    } finally {
      await unlink(temporary).catch(() => {});
    }
  }
}
