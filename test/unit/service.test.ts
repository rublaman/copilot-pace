import * as assert from 'node:assert/strict';
import { QuotaService } from '../../src/service';
import { boundedFixture, MockSessions, MockTransport } from '../../src/mocks';
import { demoClock } from '../fixtures';
import { SafeError, type HttpResponse, type HttpTransport, type SessionProvider } from '../../src/transport';

const ok = (total = 3900, used = 1950): HttpResponse => ({ status: 200, headers: {}, body: boundedFixture(total, used, demoClock.now()) });
function setup(transport: HttpTransport, sessions: SessionProvider = new MockSessions('3900-on-track')) {
  let time = Date.parse('2026-10-16T00:00Z');
  const service = new QuotaService({ transport, sessions, dataClock: demoClock, wallClock: { now: () => new Date(time) } }, () => {});
  return { service, advance: (ms: number) => { time += ms; } };
}
describe('Quota service', () => {
  it('deduplicates concurrent requests', async () => {
    let requests = 0;
    let complete!: (response: HttpResponse) => void;
    const { service } = setup({ request: async () => { requests++; return new Promise(resolve => { complete = resolve; }); } });
    const first = service.refresh(); const second = service.refresh();
    assert.equal(first, second);
    await Promise.resolve(); assert.equal(requests, 1);
    complete(ok()); await first; assert.equal(service.current.phase, 'ready');
  });
  it('discards a late response after cancelling and clearing the session', async () => {
    let complete!: (response: HttpResponse) => void;
    let signal!: AbortSignal;
    const { service } = setup({ request: async (_token, received) => { signal = received; return new Promise(resolve => { complete = resolve; }); } });
    const pending = service.refresh(); await Promise.resolve(); service.reset();
    assert.equal(signal.aborted, true); complete(ok()); await pending;
    assert.equal(service.current.snapshot, undefined); assert.equal(service.current.phase, 'loading');
  });
  it('does not publish after disposal', async () => {
    let complete!: (response: HttpResponse) => void;
    const { service } = setup({ request: async () => new Promise(resolve => { complete = resolve; }) });
    const pending = service.refresh(); await Promise.resolve(); service.dispose(); complete(ok()); await pending;
    assert.equal(service.current.snapshot, undefined);
  });
  it('does not call the transport when disconnected', async () => {
    const { service } = setup({ request: async () => assert.fail('Must not access the network') }, new MockSessions('disconnected'));
    await service.refresh(); assert.equal(service.current.phase, 'disconnected');
  });
  it('authenticates silently except on explicit connection', async () => {
    const calls: boolean[] = [];
    const { service } = setup(new MockTransport('3900-on-track'), { get: async interactive => { calls.push(interactive); return undefined; } });
    await service.refresh(); await service.refresh(true); assert.deepEqual(calls, [false, true]);
  });
  it('does not expose raw authentication errors', async () => {
    const { service } = setup(new MockTransport('3900-on-track'), { get: async () => { throw new Error('secret-token'); } });
    await service.refresh(); assert.equal(service.current.failure?.code, 'auth');
    assert.ok(!JSON.stringify(service.current).includes('secret-token'));
  });
  for (const [status, code] of [[401, 'unauthorized'], [403, 'forbidden'], [500, 'server']] as const) {
    it(`classifies HTTP ${status} without treating the response as quota`, async () => {
      const { service } = setup({ request: async () => ({ status, headers: {}, body: ok().body }) });
      await service.refresh(); assert.equal(service.current.failure?.code, code); assert.equal(service.current.snapshot, undefined);
    });
  }
  it('respects Retry-After even on manual refresh', async () => {
    let calls = 0;
    const { service, advance } = setup({ request: async () => { calls++; return { status: 429, headers: { 'retry-after': '120' }, body: undefined }; } });
    await service.refresh(); await service.refresh(true); assert.equal(calls, 1);
    advance(120000); await service.refresh(); assert.equal(calls, 2);
  });
  it('respects X-RateLimit-Reset and date-based Retry-After', async () => {
    for (const headers of [{ 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Date.parse('2026-10-16T00:02Z') / 1000) }, { 'retry-after': 'Fri, 16 Oct 2026 00:02:00 GMT' }]) {
      const { service } = setup({ request: async () => ({ status: 403, headers, body: undefined }) });
      await service.refresh(); assert.equal(service.nextAllowedAt, Date.parse('2026-10-16T00:02Z'));
    }
  });
  it('preserves stale data on transient failure and recovers', async () => {
    let attempt = 0;
    const { service, advance } = setup({ request: async () => { if (++attempt === 2) throw new SafeError('timeout', 'Timeout'); return ok(3900, attempt === 1 ? 1950 : 2000); } });
    await service.refresh(); await service.refresh();
    assert.equal(service.current.phase, 'error'); assert.equal(service.current.snapshot?.kind, 'bounded');
    await service.refresh(); assert.equal(attempt, 2);
    advance(30000); await service.refresh(); assert.equal(service.current.phase, 'ready');
    const snapshot = service.current.snapshot; if (snapshot?.kind !== 'bounded') return assert.fail();
    assert.equal(snapshot.used, 2000); assert.equal(service.nextAllowedAt, 0);
  });
  it('clears previous data when session identity changes', async () => {
    let id = 'first'; let attempt = 0;
    const { service } = setup({ request: async () => { if (++attempt === 2) throw new SafeError('network', 'Offline'); return ok(); } }, { get: async () => ({ id, accessToken: 'synthetic' }) });
    await service.refresh(); id = 'second'; await service.refresh(); assert.equal(service.current.snapshot, undefined);
  });
  it('clears previous data when GitHub rejects authorization', async () => {
    let attempt = 0;
    const { service } = setup({ request: async () => ++attempt === 1 ? ok() : { status: 401, headers: {}, body: undefined } });
    await service.refresh(); await service.refresh(); assert.equal(service.current.snapshot, undefined);
  });
  it('replaces the budget without accumulating usage', async () => {
    let total = 3900;
    const { service } = setup({ request: async () => ok(total) });
    await service.refresh(); total = 10000; await service.refresh();
    const snapshot = service.current.snapshot; if (snapshot?.kind !== 'bounded') return assert.fail();
    assert.equal(snapshot.used, 1950); assert.equal(snapshot.usedPercent, 19.5);
  });
});
