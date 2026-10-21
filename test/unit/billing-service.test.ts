import * as assert from 'node:assert/strict';
import { QuotaService } from '../../src/service';
import type { DailyUsageProvider } from '../../src/billing';
import type { DailyUsage } from '../../src/daily';
import { boundedFixture } from '../../src/mocks';
import { demoClock } from '../fixtures';
import type { Session } from '../../src/transport';

const day = Date.parse('2026-10-12T00:00Z');
const days: DailyUsage[] = [{ day, used: 50, partial: false }];
const session: Session = { id: 'first', accessToken: 'synthetic', account: { id: 'one', label: 'One' } };
const settle = () => new Promise<void>(resolve => setImmediate(resolve));

describe('Daily billing isolation from quota refresh', () => {
  function setup() {
    let selected: Session | undefined = session;
    let complete!: (items: DailyUsage[]) => void;
    let billingSignal!: AbortSignal;
    let quotaRequests = 0;
    const billing: DailyUsageProvider = {
      nextAllowedAt: 0, reset() {},
      read: async (_session, _snapshot, _quota, signal) => {
        billingSignal = signal;
        return new Promise(resolve => { complete = resolve; });
      },
    };
    const service = new QuotaService({
      sessions: { get: async () => selected }, dailyUsage: billing, dataClock: demoClock, wallClock: demoClock,
      transport: { request: async () => {
        quotaRequests++;
        return { status: 200, headers: {}, body: boundedFixture(1000, 500, demoClock.now()) };
      } },
    }, () => {});
    return { service, billing, signal: () => billingSignal, complete: (items = days) => complete(items),
      select: (value: Session | undefined) => { selected = value; }, requests: () => quotaRequests };
  }
  it('publishes quota before the daily report finishes, then updates only the history data', async () => {
    const host = setup();
    try {
      await host.service.refresh();
      assert.equal(host.service.current.phase, 'ready');
      assert.equal(host.service.current.dailyUsage, undefined);
      const snapshot = host.service.current.snapshot;
      host.complete();
      await settle();
      assert.equal(host.service.current.snapshot, snapshot);
      assert.deepEqual(host.service.current.dailyUsage, days);
      assert.equal(host.requests(), 1);
    } finally { host.service.dispose(); }
  });
  for (const action of ['reset', 'dispose', 'disconnect', 'switch account', 'new refresh'] as const) {
    it(`rejects a late billing response after ${action}`, async () => {
      const host = setup();
      await host.service.refresh();
      const completeOld = host.complete;
      const signal = host.signal();
      // Capture the resolver before another refresh replaces the test provider's pending operation.
      let resolveOld!: (items: DailyUsage[]) => void;
      host.billing.read = async () => new Promise(resolve => { resolveOld = resolve; });
      if (action === 'reset') host.service.reset();
      else if (action === 'dispose') host.service.dispose();
      else {
        if (action === 'disconnect') host.select(undefined);
        if (action === 'switch account') host.select({ ...session, id: 'second', account: { id: 'two', label: 'Two' } });
        await host.service.refresh();
      }
      assert.equal(signal.aborted, true);
      completeOld();
      await settle();
      assert.equal(host.service.current.dailyUsage, undefined);
      if (action === 'switch account' || action === 'new refresh') {
        resolveOld([]);
        await settle();
      }
      host.service.dispose();
    });
  }
  it('keeps accepted quota when billing is rejected and never forces authentication', async () => {
    const host = setup();
    host.billing.read = async () => { throw new Error('Private server response'); };
    try {
      await host.service.refresh();
      await settle();
      assert.equal(host.service.current.phase, 'ready');
      assert.equal(host.service.current.failure, undefined);
      assert.equal(host.service.current.snapshot?.kind, 'bounded');
    } finally { host.service.dispose(); }
  });
  it('applies supplemental rate limits to subsequent quota refreshes', async () => {
    const host = setup();
    try {
      await host.service.refresh();
      Object.defineProperty(host.billing, 'nextAllowedAt', { value: demoClock.now().getTime() + 7200000 });
      host.complete([]);
      await settle();
      await host.service.refresh(true);
      assert.equal(host.requests(), 1);
      assert.equal(host.service.nextAllowedAt, demoClock.now().getTime() + 7200000);
    } finally { host.service.dispose(); }
  });
});
