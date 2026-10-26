import * as assert from 'node:assert/strict';
import { calculateForecast, type Snapshot } from '../../src/domain';

const start = Date.parse('2026-10-01T00:00Z');
const end = Date.parse('2026-11-01T00:00Z');
function snapshot(asOf: string, used: number, total = 3100): Snapshot {
  return { kind: 'bounded', asOf: Date.parse(asOf), used, total, usedPercent: used / total * 100, cycle: { start, end } };
}

describe('Credit exhaustion forecast', () => {
  it('predicts a depletion date before renewal and a credit shortfall', () => {
    const value = snapshot('2026-10-11T00:00Z', 2000);
    assert.deepEqual(calculateForecast(value, new Date(value.asOf), 'all'), {
      kind: 'available', exhausted: false, exhaustionAt: Date.parse('2026-10-16T12:00Z'), excess: 3100,
    });
  });
  it('does not move the forecast when the clock advances without a new observation', () => {
    const value = snapshot('2026-10-11T00:00Z', 2000);
    assert.deepEqual(calculateForecast(value, new Date('2026-10-12T00:00Z'), 'all'), calculateForecast(value, new Date(value.asOf), 'all'));
  });
  it('skips the weekend for weekday exhaustion estimates', () => {
    const value = snapshot('2026-10-09T12:00Z', 650, 800);
    const result = calculateForecast(value, new Date(value.asOf), 'weekdays');
    assert.equal(result.kind, 'available');
    if (result.kind === 'available') assert.equal(result.exhaustionAt, Date.parse('2026-10-13T00:00Z'));
  });
  it('resumes weekday consumption on Monday after a Saturday observation', () => {
    const value = snapshot('2026-10-10T00:00Z', 700, 800);
    const result = calculateForecast(value, new Date(value.asOf), 'weekdays');
    assert.equal(result.kind, 'available');
    if (result.kind === 'available') assert.equal(result.exhaustionAt, Date.parse('2026-10-13T00:00Z'));
  });
  it('does not show a false depletion date at zero or sustainable usage', () => {
    for (const used of [0, 500, 1000]) {
      const value = snapshot('2026-10-11T00:00Z', used);
      assert.deepEqual(calculateForecast(value, new Date(value.asOf), 'all'), { kind: 'available', exhausted: false, excess: 0 });
    }
  });
  it('identifies an already exhausted budget without guessing when it ran out', () => {
    const value = snapshot('2026-10-11T00:00Z', 3100);
    const result = calculateForecast(value, new Date(value.asOf), 'all');
    assert.equal(result.kind, 'available');
    if (result.kind === 'available') {
      assert.equal(result.exhausted, true);
      assert.equal(result.exhaustionAt, undefined);
      assert.equal(result.excess, 6510);
    }
  });
  it('requires an observed eligible day, a valid cycle and a known budget', () => {
    for (const value of [
      snapshot('2026-10-01T12:00Z', 100),
      { kind: 'usageOnly', used: 100, asOf: start, cycle: { start, end } },
      { kind: 'unavailable', reason: 'missingQuota', asOf: start },
    ] as Snapshot[]) assert.deepEqual(calculateForecast(value, new Date(value.asOf), 'all'), { kind: 'unavailable' });
    const value = snapshot('2026-10-11T00:00Z', 2000);
    assert.deepEqual(calculateForecast(value, new Date(end), 'all'), { kind: 'unavailable' });
    assert.deepEqual(calculateForecast(value, new Date(start), 'all'), { kind: 'unavailable' });
  });
});
