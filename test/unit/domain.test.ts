import * as assert from 'node:assert/strict';
import { calculatePace, equivalentDays, normalizeQuota, type Snapshot } from '../../src/domain';
import { boundedFixture } from '../../src/mocks';
import { demoClock } from '../fixtures';

const now = demoClock.now();
const bounded = (total: number, used: number) => normalizeQuota(boundedFixture(total, used, now), now);
function quota(overrides: Record<string, unknown>, root: Record<string, unknown> = {}) {
  return { token_based_billing: true, quota_reset_date_utc: '2026-11-01T00:00:00Z', quota_snapshots: { premium_interactions: { unlimited: false, entitlement: 3900, percent_remaining: 50, ...overrides } }, ...root };
}
describe('Quota normalization', () => {
  it('respects the assigned budget without treating has_quota false as exhaustion', () => {
    const snapshot = bounded(10000, 4000);
    assert.equal(snapshot.kind, 'bounded');
    if (snapshot.kind !== 'bounded') return;
    assert.equal(snapshot.total, 10000);
    assert.equal(snapshot.used, 4000);
    assert.equal(snapshot.usedPercent, 40);
    assert.equal(snapshot.cycle?.end, Date.parse('2026-11-01T00:00:00Z'));
  });
  it('does not divide credits_used by entitlement', () => {
    const snapshot = normalizeQuota(quota({ quota_remaining: 1950, credits_used: 987654 }), now);
    assert.equal(snapshot.kind, 'bounded');
    if (snapshot.kind === 'bounded') {
      assert.equal(snapshot.used, 1950);
      assert.equal(snapshot.usedPercent, 50);
    }
  });
  it('preserves the native percentage when remaining credits round differently', () => {
    const snapshot = normalizeQuota(quota({ quota_remaining: 2000 }), now);
    if (snapshot.kind !== 'bounded') return assert.fail();
    assert.equal(snapshot.used, 1900);
    assert.equal(snapshot.usedPercent, 50);
  });
  it('accepts numeric strings and derives usage from percentage', () => {
    const snapshot = normalizeQuota(quota({ entitlement: '3900', percent_remaining: '50' }), now);
    if (snapshot.kind !== 'bounded') return assert.fail();
    assert.equal(snapshot.used, 1950);
  });
  it('falls back to quota_remaining when percentage is absent', () => {
    const snapshot = normalizeQuota(quota({ percent_remaining: undefined, quota_remaining: 1950 }), now);
    if (snapshot.kind !== 'bounded') return assert.fail();
    assert.equal(snapshot.usedPercent, 50);
  });
  it('clamps extreme percentages like the native indicator', () => {
    for (const [remaining, usedPercent] of [[-5, 100], [105, 0]]) {
      const snapshot = normalizeQuota(quota({ percent_remaining: remaining }), now);
      if (snapshot.kind !== 'bounded') return assert.fail();
      assert.equal(snapshot.usedPercent, usedPercent);
    }
  });
  it('recalculates budget increases and decreases without accumulating deltas', () => {
    const snapshots = [bounded(3900, 1950), bounded(10000, 1950), bounded(2500, 1950)];
    assert.deepEqual(snapshots.map(value => value.kind === 'bounded' ? value.used : undefined), [1950, 1950, 1950]);
    assert.deepEqual(snapshots.map(value => value.kind === 'bounded' ? value.usedPercent : undefined), [50, 19.5, 78]);
  });
  for (const [name, body] of Object.entries({
    missing: {}, null: null, zero: quota({ entitlement: 0 }), negative: quota({ entitlement: -1 }),
    infinite: quota({ entitlement: Infinity }), 'missing-usage': quota({ percent_remaining: undefined }),
    legacy: quota({}, { token_based_billing: false }), 'chat-only': { token_based_billing: true, quota_snapshots: { chat: { entitlement: 10000, percent_remaining: 50, unlimited: false } } },
  })) it(`does not fabricate zero usage for ${name}`, () => assert.equal(normalizeQuota(body, now).kind, 'unavailable'));
  it('shows unlimited usage without a percentage', () => {
    const snapshot = normalizeQuota(quota({ unlimited: true, credits_used: 123 }), now);
    assert.equal(snapshot.kind, 'usageOnly');
    if (snapshot.kind === 'usageOnly') assert.equal(snapshot.used, 123);
  });
  it('reports an exhausted budget as 100 percent used', () => {
    const snapshot = bounded(3900, 3900);
    if (snapshot.kind !== 'bounded') return assert.fail();
    assert.equal(snapshot.usedPercent, 100);
  });
  it('prefers quota resetAt and rejects unknown cycles', () => {
    const valid = normalizeQuota(quota({ quota_reset_at: Date.parse('2026-11-01T00:00Z') / 1000 }, { quota_reset_date_utc: 'invalid' }), now);
    assert.ok(valid.cycle);
    const invalid = normalizeQuota(quota({}, { quota_reset_date_utc: '2026-11-15T00:00Z' }), now);
    assert.equal(invalid.cycle, undefined);
  });
});

describe('Monthly pace', () => {
  for (const mode of ['all', 'weekdays'] as const) {
    for (const [total, used, label] of [[10000, 4000, 'Comfortable'], [3900, 1755, 'On track'], [3900, 2340, 'Over pace']] as const) {
      it(`${mode}: ${used}/${total} returns ${label}`, () => assert.equal(calculatePace(bounded(total, used), now, mode).label, label));
    }
  }
  it('calculates the approximate average and projection', () => {
    const result = calculatePace(bounded(3900, 1950), now, 'all');
    if (result.kind !== 'available') return assert.fail();
    assert.equal(result.dailyAverage, 130);
    assert.equal(result.projected, 4030);
  });
  it('classifies exactly 90 and 100 percent as On track', () => {
    for (const [used, label] of [[449, 'Comfortable'], [450, 'On track'], [500, 'On track'], [501, 'Over pace']] as const) {
      const snapshot: Snapshot = { kind: 'bounded', total: 1000, used, usedPercent: used / 10, asOf: 0, cycle: { start: 0, end: 2 * 86400000 } };
      assert.equal(calculatePace(snapshot, new Date(86400000), 'all').label, label);
    }
  });
  it('waits for an equivalent day and does not project outside the cycle', () => {
    const snapshot = bounded(3900, 1950);
    assert.equal(calculatePace(snapshot, new Date('2026-10-01T12:00Z'), 'all').kind, 'pending');
    assert.equal(calculatePace(snapshot, new Date('2026-11-01T00:00Z'), 'all').kind, 'unavailable');
    assert.equal(calculatePace({ kind: 'usageOnly', used: 15, asOf: 0 }, now, 'all').kind, 'unavailable');
  });
  it('counts partial days and excludes weekends', () => {
    assert.equal(equivalentDays(Date.parse('2026-10-16T12:00Z'), Date.parse('2026-10-19T12:00Z'), 'all'), 3);
    assert.equal(equivalentDays(Date.parse('2026-10-16T12:00Z'), Date.parse('2026-10-19T12:00Z'), 'weekdays'), 1);
  });
  it('handles leap years and months independently of local clock changes', () => {
    assert.equal(equivalentDays(Date.parse('2024-02-01T00:00Z'), Date.parse('2024-03-01T00:00Z'), 'all'), 29);
    assert.equal(equivalentDays(Date.parse('2025-02-01T00:00Z'), Date.parse('2025-03-01T00:00Z'), 'all'), 28);
    assert.equal(equivalentDays(Date.parse('2026-10-01T00:00Z'), Date.parse('2026-11-01T00:00Z'), 'all'), 31);
    assert.equal(equivalentDays(Date.parse('2026-10-01T00:00Z'), Date.parse('2026-11-01T00:00Z'), 'weekdays'), 22);
  });
});
