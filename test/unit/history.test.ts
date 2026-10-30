import * as assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { observedDailyUsage, UTC_DAY } from '../../src/daily';
import { HistoryStore, historyIdentity, observation, retainObservations, type Observation } from '../../src/history';

const at = Date.parse('2026-10-21T12:00Z');
const clock = { now: () => new Date(at + 60_000) };
const identity = historyIdentity('github', 'https://github.com', 'account');
const point = (time = at, used = 100): Observation => ({ at: time, used, total: 1000, start: Date.parse('2026-10-01T00:00Z'), end: Date.parse('2026-11-01T00:00Z') });
const cycle = { start: point().start, end: point().end };

describe('Local observed usage history', () => {
  let directory: string;
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'copilot-pace-history-')); });
  afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

  it('restores observations after restart and stores no account labels or credentials', async () => {
    await new HistoryStore(directory, clock).append(identity, point());
    assert.deepEqual(await new HistoryStore(directory, clock).read(identity, clock.now().getTime(), cycle), [point()]);
    const body = await readFile(join(directory, (await readdir(directory))[0]!), 'utf8');
    assert.deepEqual(Object.keys(JSON.parse(body).observations[0]).sort(), ['at', 'end', 'start', 'total', 'used']);
    assert.ok(!body.includes('account'));
  });
  it('merges concurrent windows and out-of-order observations without lost writes', async () => {
    const first = new HistoryStore(directory, clock);
    const second = new HistoryStore(directory, clock);
    await Promise.all([
      first.append(identity, point(at + 1000, 120)),
      second.append(identity, point(at, 100)),
      first.append(identity, point(at + 2000, 130)),
    ]);
    assert.deepEqual(await second.read(identity, clock.now().getTime(), cycle), [point(), point(at + 1000, 120), point(at + 2000, 130)]);
    assert.equal((await readdir(directory)).length, 2);
  });
  it('selects the latest account journal across days and windows without exposing temporary or foreign files', async () => {
    const store = new HistoryStore(directory, clock);
    assert.equal(await store.latestFile(identity), undefined);
    const old = `${identity}.2026-10-20.00000000-0000-0000-0000-000000000000.json`;
    const first = `${identity}.2026-10-21.00000000-0000-0000-0000-000000000001.json`;
    const latest = `${identity}.2026-10-21.00000000-0000-0000-0000-000000000002.json`;
    const foreign = `${historyIdentity('github', 'https://github.com', 'other')}.2026-10-22.00000000-0000-0000-0000-000000000003.json`;
    for (const name of [old, first, latest, foreign, `${latest}.00000000-0000-0000-0000-000000000004.tmp`]) {
      await writeFile(join(directory, name), '{}');
    }
    await utimes(join(directory, first), at / 1000, at / 1000);
    await utimes(join(directory, latest), at / 1000 + 1, at / 1000 + 1);
    assert.equal(await store.latestFile(identity), join(directory, latest));
    await assert.rejects(store.latestFile('../outside'), /identity/);
  });
  it('isolates accounts, authentication providers and Enterprise origins', async () => {
    const keys = [identity, historyIdentity('github', 'https://github.com', 'other'),
      historyIdentity('github-enterprise', 'https://one.example', 'account'),
      historyIdentity('github-enterprise', 'https://two.example', 'account')];
    assert.equal(new Set(keys).size, 4);
    const store = new HistoryStore(directory, clock);
    await store.append(identity, point());
    for (const key of keys.slice(1)) assert.deepEqual(await store.read(key, at, cycle), []);
    await assert.rejects(store.read('../outside', at, cycle), /identity/);
  });
  it('deduplicates repeated observations and retains corrections and cycle boundaries', async () => {
    const store = new HistoryStore(directory, clock);
    await store.append(identity, point());
    await store.append(identity, point());
    await store.append(identity, point(at + 1000, 90));
    assert.deepEqual(await store.read(identity, at + 1000, cycle), [point(), point(at + 1000, 90)]);
  });
  it('expires daily journals after 90 days while leaving unrelated files intact', async () => {
    const store = new HistoryStore(directory, clock);
    await store.append(identity, point());
    await writeFile(join(directory, 'keep.txt'), 'unrelated');
    assert.deepEqual(await store.read(identity, at + 92 * 86_400_000, cycle), []);
    assert.equal((await readdir(directory)).length, 2, 'Reading must not perform maintenance');
    await store.prune(at + 92 * 86_400_000);
    assert.deepEqual(await readdir(directory), ['keep.txt']);
  });
  for (const [name, body] of [
    ['an empty file', ''],
    ['malformed JSON', '{broken'],
    ['a truncated write', '{"version":1,"observations":[{"at":'],
    ['a null document', 'null'],
    ['an unsupported version', JSON.stringify({ version: 2, observations: [point()] })],
    ['a missing version', JSON.stringify({ observations: [point()] })],
    ['an unsupported schema', JSON.stringify({ version: 1, observations: {} })],
    ['an oversized journal', ' '.repeat(3 * 1024 * 1024 + 1)],
  ] as const) {
    it(`skips ${name} while restoring healthy journals and preserving the damaged file`, async () => {
      const store = new HistoryStore(directory, clock);
      await store.append(identity, point());
      const file = join(directory, (await readdir(directory))[0]!);
      await writeFile(file, body);
      const healthy = [point(at + 1000, 120), point(at + 2000, 130)];
      const otherWindow = new HistoryStore(directory, clock);
      for (const item of healthy) await otherWindow.append(identity, item);

      const recovered = new HistoryStore(directory, clock);
      assert.deepEqual(await recovered.read(identity, at + 2000, cycle), healthy);
      assert.equal((await readdir(directory)).length, 2, 'Reading must not replace damaged files');

      const items = await recovered.append(identity, point(at + 3000, 140));

      assert.deepEqual(items, [...healthy, point(at + 3000, 140)]);
      assert.deepEqual(await new HistoryStore(directory, clock).read(identity, at + 3000, cycle), items);
      assert.deepEqual(observedDailyUsage(items, cycle), [
        { day: Date.parse('2026-10-21T00:00Z'), used: 20, partial: true },
      ]);
      assert.equal(await readFile(file, 'utf8'), body);
      assert.equal((await readdir(directory)).length, 3);
    });
  }
  it('starts a new journal when the current writer file is damaged', async () => {
    const store = new HistoryStore(directory, clock);
    await store.append(identity, point());
    const file = join(directory, (await readdir(directory))[0]!);
    await writeFile(file, '{broken');

    const items = await store.append(identity, point(at + 1000, 120));

    assert.deepEqual(items, [point(at + 1000, 120)]);
    assert.equal((await readdir(directory)).length, 2);
    assert.equal(await readFile(file, 'utf8'), '{broken');
  });
  for (const [name, invalid] of [
    ['a null record', null],
    ['a boolean record', false],
    ['a string record', 'invalid'],
    ['missing fields', {}],
    ['negative credits', { ...point(at - 30_000), used: -1 }],
    ['credits stored as text', { ...point(at - 30_000), used: '999' }],
    ['null credits', { ...point(at - 30_000), used: null }],
    ['an out-of-range timestamp', { ...point(), at: 9e15 }],
    ['a timestamp at renewal', { ...point(), at: cycle.end }],
    ['a cycle starting after the observation', { ...point(at - 30_000), start: at + 1 }],
    ['an inverted cycle', { ...point(at - 30_000), end: cycle.start }],
    ['an oversized cycle', { ...point(at - 30_000), end: cycle.start + 33 * UTC_DAY }],
    ['a zero budget', { ...point(at - 30_000), total: 0 }],
    ['a budget stored as text', { ...point(at - 30_000), total: '1000' }],
    ['a future observation', point(at + 120_000, 999)],
    ['another cycle', { ...point(at - 30_000, 999), start: cycle.start + UTC_DAY }],
  ] as const) {
    it(`restores healthy daily usage beside ${name} without rewriting the journal`, async () => {
      const healthy = [point(at - 60_000, 90), point()];
      const body = JSON.stringify({ version: 1, observations: [
        { ...healthy[0], token: 'must-not-restore', prompt: 'private' }, invalid, healthy[1],
      ] });
      const file = join(directory, `${identity}.2026-10-21.00000000-0000-0000-0000-000000000000.json`);
      await writeFile(file, body);

      const items = await new HistoryStore(directory, clock).read(identity, at, cycle);

      assert.deepEqual(items, healthy);
      assert.deepEqual(observedDailyUsage(items, cycle), [
        { day: Date.parse('2026-10-21T00:00Z'), used: 10, partial: true },
      ]);
      assert.equal(await readFile(file, 'utf8'), body);
    });
  }
  for (const damage of ['corrupted', 'deleted']) {
    it(`keeps surrounding UTC days when a daily journal is ${damage} without inventing usage for the gap`, async () => {
      const now = at + UTC_DAY;
      const store = new HistoryStore(directory, { now: () => new Date(now) });
      const healthy = [
        point(at - UTC_DAY - 60_000, 70), point(at - UTC_DAY, 80),
        point(now - 60_000, 140), point(now, 155),
      ];
      for (const item of healthy) await store.append(identity, item);
      await store.append(identity, point());
      const damaged = (await readdir(directory)).find(name => name.includes('.2026-10-21.'))!;
      const file = join(directory, damaged);
      if (damage === 'corrupted') await writeFile(file, '{broken');
      else await rm(file);

      const items = await new HistoryStore(directory, clock).read(identity, now, cycle);

      assert.deepEqual(items, healthy);
      assert.deepEqual(observedDailyUsage(items, cycle), [
        { day: Date.parse('2026-10-20T00:00Z'), used: 10, partial: true },
        { day: Date.parse('2026-10-22T00:00Z'), used: 15, partial: true },
      ]);
      if (damage === 'corrupted') assert.equal(await readFile(file, 'utf8'), '{broken');
    });
  }
  it('ignores complete and truncated abandoned writes and quarantined files when restoring daily usage', async () => {
    const healthy = [point(at - 60_000, 90), point()];
    const store = new HistoryStore(directory, clock);
    for (const item of healthy) await store.append(identity, item);
    const file = (await readdir(directory))[0]!;
    const abandoned = [
      [`${file}.00000000-0000-0000-0000-000000000001.tmp`, JSON.stringify({ version: 1, observations: [point(at + 1000, 999)] })],
      [`${file}.00000000-0000-0000-0000-000000000002.tmp`, '{"version":1,"observations":['],
      [`${file}.corrupt`, '{broken'],
    ] as const;
    for (const [name, body] of abandoned) await writeFile(join(directory, name), body);

    const recovered = new HistoryStore(directory, clock);
    const items = await recovered.read(identity, at + 1000, cycle);

    assert.deepEqual(items, healthy);
    assert.deepEqual(observedDailyUsage(items, cycle), [
      { day: Date.parse('2026-10-21T00:00Z'), used: 10, partial: true },
    ]);
    assert.equal(await recovered.latestFile(identity), join(directory, file));
    for (const [name, body] of abandoned) assert.equal(await readFile(join(directory, name), 'utf8'), body);
  });
  for (const removed of ['journal', 'directory']) {
    it(`resumes recording after the ${removed} is deleted without recreating lost daily totals`, async () => {
      const store = new HistoryStore(directory, clock);
      await store.append(identity, point(at - 60_000, 90));
      await store.append(identity, point());
      const name = (await readdir(directory))[0]!;
      const file = join(directory, name);
      if (removed === 'journal') await rm(file);
      else await rm(directory, { recursive: true });

      assert.deepEqual(await store.read(identity, at, cycle), []);
      assert.equal(await store.latestFile(identity), undefined);
      const first = await store.append(identity, point(at + 1000, 120));
      const items = await store.append(identity, point(at + 2000, 125));

      assert.deepEqual(first, [point(at + 1000, 120)]);
      assert.deepEqual(observedDailyUsage(first, cycle), []);
      assert.deepEqual(items, [point(at + 1000, 120), point(at + 2000, 125)]);
      assert.deepEqual(observedDailyUsage(items, cycle), [
        { day: Date.parse('2026-10-21T00:00Z'), used: 5, partial: true },
      ]);
      assert.deepEqual(await new HistoryStore(directory, clock).read(identity, at + 2000, cycle), items);
      assert.deepEqual(await readdir(directory), [name]);
    });
  }
  it('recovers the write queue after a storage failure and preserves the inaccessible entry', async () => {
    const store = new HistoryStore(directory, clock);
    await store.append(identity, point());
    const file = join(directory, (await readdir(directory))[0]!);
    await rm(file);
    await mkdir(file);
    await writeFile(join(file, 'keep.txt'), 'preserved');

    await assert.rejects(store.append(identity, point(at + 1000, 120)));

    assert.equal(await readFile(join(file, 'keep.txt'), 'utf8'), 'preserved');
    assert.equal((await readdir(directory)).length, 1);
    await rm(file, { recursive: true });
    const items = await store.append(identity, point(at + 2000, 125));

    assert.deepEqual(items, [point(at + 2000, 125)]);
    assert.deepEqual(await new HistoryStore(directory, clock).read(identity, at + 2000, cycle), items);
  });
  it('keeps real storage errors visible instead of treating them as damaged JSON', async () => {
    const file = join(directory, `${identity}.2026-10-21.00000000-0000-0000-0000-000000000000.json`);
    await mkdir(file);

    await assert.rejects(new HistoryStore(directory, clock).read(identity, at, cycle));
  });
  it('loads only the requested account and cycle without opening other daily journals', async () => {
    const store = new HistoryStore(directory, clock);
    await store.append(identity, point());
    const foreign = historyIdentity('github', 'https://github.com', 'other');
    for (const [key, day] of [[identity, '2026-09-21'], [identity, '2026-11-01'], [foreign, '2026-10-21']]) {
      // These paths would fail a file read, so a broad scan cannot pass unnoticed.
      await mkdir(join(directory, `${key}.${day}.00000000-0000-0000-0000-000000000000.json`));
    }
    const mismatched = { ...point(), start: cycle.start + 86_400_000 };
    await writeFile(join(directory, `${identity}.2026-10-20.00000000-0000-0000-0000-000000000001.json`),
      JSON.stringify({ version: 1, observations: [mismatched] }));

    assert.deepEqual(await store.read(identity, at, cycle), [point()]);
  });
  it('prunes expired journals, abandoned temporaries and quarantined files across accounts', async () => {
    const foreign = historyIdentity('github', 'https://github.com', 'other');
    const expired = `${identity}.2026-07-01.00000000-0000-0000-0000-000000000000.json`;
    const temporary = `${expired}.00000000-0000-0000-0000-000000000001.tmp`;
    const quarantined = `${expired}.corrupt`;
    const otherAccount = `${foreign}.2026-07-01.00000000-0000-0000-0000-000000000000.json`;
    const current = `${identity}.2026-10-21.00000000-0000-0000-0000-000000000000.json`;
    const invalidDate = `${identity}.2026-02-31.00000000-0000-0000-0000-000000000000.json`;
    for (const name of [expired, temporary, quarantined, otherAccount, current, invalidDate, 'keep.txt']) {
      await writeFile(join(directory, name), 'preserve unrelated content');
    }

    await new HistoryStore(directory, clock).prune(at);

    assert.deepEqual((await readdir(directory)).sort(), [current, invalidDate, 'keep.txt'].sort());
  });
  it('continues pruning when an expired entry cannot be deleted and leaves its contents intact', async () => {
    const blocked = `${identity}.2026-07-01.00000000-0000-0000-0000-000000000000.json`;
    const expired = `${identity}.2026-07-02.00000000-0000-0000-0000-000000000000.json`;
    await mkdir(join(directory, blocked));
    await writeFile(join(directory, blocked, 'keep.txt'), 'preserved');
    await writeFile(join(directory, expired), '{}');

    await new HistoryStore(directory, clock).prune(at);

    assert.deepEqual(await readdir(directory), [blocked]);
    assert.equal(await readFile(join(directory, blocked, 'keep.txt'), 'utf8'), 'preserved');
  });
  it('preserves a daily journal until the entire UTC day has expired', async () => {
    const day = Date.parse('2026-07-01T00:00Z');
    const boundary = day + 91 * 86_400_000;
    const file = `${identity}.2026-07-01.00000000-0000-0000-0000-000000000000.json`;
    await writeFile(join(directory, file), '{}');
    const store = new HistoryStore(directory, clock);

    await store.prune(boundary);
    assert.deepEqual(await readdir(directory), [file]);
    await store.prune(boundary + 1);
    assert.deepEqual(await readdir(directory), []);
  });
  it('drops malformed, future and expired records and strips unrelated fields', () => {
    const extra = { ...point(), token: 'must-not-persist', prompt: 'private' };
    assert.deepEqual(retainObservations([extra, point(at + 1), { ...point(), used: -1 }], at), [point()]);
    assert.deepEqual(retainObservations([point()], at + 91 * 86_400_000), []);
    assert.equal(observation({ kind: 'unavailable', reason: 'missingQuota', asOf: at }), undefined);
    assert.equal(observation({ kind: 'bounded', used: 1, total: 100, usedPercent: 1, asOf: at }), undefined);
  });
});
