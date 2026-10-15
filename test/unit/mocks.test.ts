import * as assert from 'node:assert/strict';
import { MockSessions, MockTransport } from '../../src/mocks';
import { QuotaService } from '../../src/service';
import { createViewModel } from '../../src/view';

function demoAt(initial: string) {
  let time = new Date(initial);
  const clock = { now: () => time };
  const service = new QuotaService({
    sessions: new MockSessions('10000-comfortable'),
    transport: new MockTransport('10000-comfortable', clock),
    dataClock: clock, wallClock: clock,
  }, () => {});
  return { clock, service, advanceTo: (value: string) => { time = new Date(value); } };
}

describe('Demo calendar', () => {
  it('counts the actual days and weekdays left on October 12, including partial days', async () => {
    const { clock, service } = demoAt('2026-10-12T12:00:00Z');
    try {
      await service.refresh();
      const all = createViewModel(service.current, clock, 'all', true, 'Demo', 0);
      const weekdays = createViewModel(service.current, clock, 'weekdays', true, 'Demo', 0);
      assert.equal(all.daysLeft, '19.5 days left');
      assert.equal(weekdays.daysLeft, '14.5 weekdays left');
      assert.equal(all.cycleProgress, '37.1%');
      assert.equal(weekdays.cycleProgress, '34.1%');
      assert.equal(all.referenceDate, 'Oct 12, 2026, 12:00 PM UTC');
      assert.equal(all.updated, all.referenceDate);
      assert.equal(all.summary, 'Over pace');
      assert.equal(all.percentage, '40%');
    } finally { service.dispose(); }
  });
  for (const [now, renewal, days] of [
    ['2026-12-31T00:00:00Z', '2027-01-01T00:00:00Z', '1 days left'],
    ['2028-02-12T00:00:00Z', '2028-03-01T00:00:00Z', '18 days left'],
    ['2027-02-12T00:00:00Z', '2027-03-01T00:00:00Z', '17 days left'],
  ] as const) {
    it(`uses the current monthly renewal at ${now}`, async () => {
      const { clock, service } = demoAt(now);
      try {
        await service.refresh();
        assert.equal(service.current.snapshot?.cycle?.end, Date.parse(renewal));
        assert.equal(createViewModel(service.current, clock, 'all', true, 'Demo', 0).daysLeft, days);
      } finally { service.dispose(); }
    });
  }
  it('moves into the next cycle on refresh without restarting the demo', async () => {
    const { clock, service, advanceTo } = demoAt('2026-10-31T12:00:00Z');
    try {
      await service.refresh();
      advanceTo('2026-11-01T00:00:00Z');
      await service.refresh();
      assert.deepEqual(service.current.snapshot?.cycle, {
        start: Date.parse('2026-11-01T00:00:00Z'), end: Date.parse('2026-12-01T00:00:00Z'),
      });
      const model = createViewModel(service.current, clock, 'all', true, 'Demo', 0);
      assert.equal(model.period, 'November 2026');
      assert.equal(model.daysLeft, '30 days left');
      assert.equal(model.summary, 'Calculating pace');
      assert.equal(model.tone, 'neutral');
    } finally { service.dispose(); }
  });
});
