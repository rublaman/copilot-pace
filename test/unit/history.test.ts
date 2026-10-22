import * as assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HistoryStore, historyIdentity, observation, retainObservations, type Observation } from '../../src/history';

const at = Date.parse('2026-10-21T12:00Z');
const clock = { now: () => new Date(at + 60_000) };
const identity = historyIdentity('github', 'https://github.com', 'account');
const point = (time = at, used = 100): Observation => ({ at: time, used, total: 1000, start: Date.parse('2026-10-01T00:00Z'), end: Date.parse('2026-11-01T00:00Z') });

describe('Local observed usage history', () => {
  let directory: string;
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'copilot-pace-history-')); });
  afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

  it('restores observations after restart and stores no account labels or credentials', async () => {
    await new HistoryStore(directory, clock).append(identity, point());
    assert.deepEqual(await new HistoryStore(directory, clock).read(identity, clock.now().getTime()), [point()]);
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
    assert.deepEqual(await second.read(identity, clock.now().getTime()), [point(), point(at + 1000, 120), point(at + 2000, 130)]);
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
    for (const key of keys.slice(1)) assert.deepEqual(await store.read(key, at), []);
    await assert.rejects(store.read('../outside', at), /identity/);
  });
  it('deduplicates repeated observations and retains corrections and cycle boundaries', async () => {
    const store = new HistoryStore(directory, clock);
    await store.append(identity, point());
    await store.append(identity, point());
    await store.append(identity, point(at + 1000, 90));
    assert.deepEqual(await store.read(identity, at + 1000), [point(), point(at + 1000, 90)]);
  });
  it('expires daily journals after 90 days while leaving unrelated files intact', async () => {
    const store = new HistoryStore(directory, clock);
    await store.append(identity, point());
    await writeFile(join(directory, 'keep.txt'), 'unrelated');
    assert.deepEqual(await store.read(identity, at + 92 * 86_400_000), []);
    assert.deepEqual(await readdir(directory), ['keep.txt']);
  });
  it('does not overwrite corrupt or unsupported history silently', async () => {
    const store = new HistoryStore(directory, clock);
    await store.append(identity, point());
    const file = join(directory, (await readdir(directory))[0]!);
    await writeFile(file, '{broken');
    await assert.rejects(new HistoryStore(directory, clock).read(identity, at));
    assert.equal(await readFile(file, 'utf8'), '{broken');
  });
  it('drops malformed, future and expired records and strips unrelated fields', () => {
    const extra = { ...point(), token: 'must-not-persist', prompt: 'private' };
    assert.deepEqual(retainObservations([extra, point(at + 1), { ...point(), used: -1 }], at), [point()]);
    assert.deepEqual(retainObservations([point()], at + 91 * 86_400_000), []);
    assert.equal(observation({ kind: 'unavailable', reason: 'Unknown', asOf: at }), undefined);
    assert.equal(observation({ kind: 'bounded', used: 1, total: 100, usedPercent: 1, asOf: at }), undefined);
  });
});
