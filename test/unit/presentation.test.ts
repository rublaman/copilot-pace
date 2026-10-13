import * as assert from 'node:assert/strict';
import { normalizeQuota } from '../../src/domain';
import { boundedFixture, MockSessions, MockTransport, resolveScenario, scenarioLabels } from '../../src/mocks';
import { demoClock } from '../fixtures';
import { createViewModel, renderHtml, renderHover, hoverCommands } from '../../src/presentation';
import { QuotaService } from '../../src/service';

describe('Presentation and demo scenarios', () => {
  const snapshot = normalizeQuota(boundedFixture(10000, 4000, demoClock.now()), demoClock.now());
  it('shows remaining credits and sustainable daily allowance in English', () => {
    const model = createViewModel({ phase: 'ready', snapshot }, demoClock, 'all', true, 'Demo', 0);
    assert.equal(model.remaining, '6,000 credits');
    assert.equal(model.dailyAverage, '266.7 / day');
    assert.equal(model.allowance, '375 / day');
    assert.equal(model.baseRate, '322.6 / day');
    assert.equal(model.cycleProgress, '48.4%');
    assert.equal(model.daysLeft, '16 days left');
    assert.equal(model.period, 'October 2026');
    assert.equal(model.projection, '8,266.7 credits (82.7%)');
  });
  it('uses eligible weekdays for the baseline, allowance and progress', () => {
    const model = createViewModel({ phase: 'ready', snapshot }, demoClock, 'weekdays', true, 'Demo', 0);
    assert.equal(model.daysLeft, '11 weekdays left');
    assert.equal(model.cycleProgress, '50%');
    assert.equal(model.dailyAverage, '363.6 / day');
    assert.equal(model.allowance, '545.5 / day');
  });
  it('does not invent an allowance for an unknown budget or expired cycle', () => {
    for (const state of [
      { kind: 'usageOnly' as const, used: 15, asOf: 0 },
      { kind: 'bounded' as const, used: 15, total: 20, usedPercent: 75, asOf: 0, cycle: { start: 0, end: 86400000 } },
    ]) {
      const model = createViewModel({ phase: 'ready', snapshot: state }, demoClock, 'all', false, '', 0);
      assert.equal(model.allowance, '—'); assert.equal(model.cycleValue, null); assert.equal(model.projection, '—');
    }
  });
  it('keeps early-cycle averages pending and exhausted allowances at zero', () => {
    const early = createViewModel({ phase: 'ready', snapshot }, { now: () => new Date('2026-10-01T12:00Z') }, 'all', true, 'Demo', 0);
    assert.equal(early.dailyAverage, '—'); assert.equal(early.summary, 'Calculating pace');
    const exhausted = createViewModel({ phase: 'ready', snapshot: normalizeQuota(boundedFixture(3900, 3900, demoClock.now()), demoClock.now()) }, demoClock, 'all', true, 'Demo', 0);
    assert.equal(exhausted.remaining, '0 credits'); assert.equal(exhausted.allowance, '0 / day');
  });
  it('escapes untrusted Markdown and only inserts fixed action links', () => {
    const model = createViewModel({ phase: 'ready', snapshot }, demoClock, 'all', true, 'Demo', 0);
    model.message = '[run](command:evil) <img> | $(warning)\nextra';
    const hover = renderHover(model);
    assert.ok(hover.includes('Average:')); assert.ok(hover.includes('6,000 credits'));
    assert.ok(hover.includes('\\[run\\]\\(command:evil\\)'));
    assert.ok(!hover.includes('[run](command:evil)'));
    assert.ok(hover.includes('\\<img\\> \\| \\$\\(warning\\) extra'));
    assert.deepEqual([...hover.matchAll(/\]\(command:([\w.]+)\)/g)].map(match => match[1]), ['copilotPace.showDetails', 'copilotPace.refresh', 'copilotPace.demo']);
    assert.ok(!hoverCommands.includes('evil'));
  });
  it('preserves saved 0.1.0 demo choices without exposing legacy labels', () => {
    assert.equal(resolveScenario('3900-justo'), '3900-on-track');
    assert.equal(resolveScenario('presupuesto-10000'), 'budget-10000');
    assert.equal(resolveScenario('constructor'), '10000-comfortable');
  });
  it('keeps the status text minimal and identifies synthetic data', () => {
    const model = createViewModel({ phase: 'ready', snapshot }, demoClock, 'all', true, 'Demo', 0);
    assert.equal(model.statusText, '40% · Comfortable · Demo'); assert.equal(model.canConnect, false);
    assert.ok(model.referenceDate.includes('2026'));
  });
  it('marks the previous snapshot as out of date', () => {
    const model = createViewModel({ phase: 'error', snapshot }, demoClock, 'all', false, '', 0);
    assert.equal(model.statusText, '40% · Out of date');
    assert.equal(model.tone, 'neutral');
  });
  it('shows retry availability using the injected clock', () => {
    const retryAt = Date.parse('2001-01-01T00:01:00Z');
    const model = (time: number) => createViewModel({ phase: 'error' }, { now: () => new Date(time) }, 'all', false, '', retryAt);
    assert.equal(model(retryAt - 1000).retry, 'Next refresh allowed: Jan 1, 2001, 12:01 AM UTC');
    assert.equal(model(retryAt).retry, '');
    assert.equal(model(retryAt + 1000).retry, '');
  });
  it('assigns status tones from projected usage, including an exhausted budget', () => {
    for (const [used, tone] of [[4000, 'good'], [4500, 'watch'], [6000, 'over'], [10000, 'over']] as const) {
      const snapshot = normalizeQuota(boundedFixture(10000, used, demoClock.now()), demoClock.now());
      assert.equal(createViewModel({ phase: 'ready', snapshot }, demoClock, 'all', true, 'Demo', 0).tone, tone);
    }
  });
  it('does not show zero usage while disconnected or loading', () => {
    for (const phase of ['disconnected', 'loading', 'error'] as const) {
      assert.ok(!createViewModel({ phase }, demoClock, 'all', false, '', 0).statusText.includes('0%'));
    }
  });
  it('uses CSP and text content without exposing credentials', () => {
    const model = createViewModel({ phase: 'ready' }, demoClock, 'all', true, '</script><img src=x onerror=alert(1)>', 0);
    const html = renderHtml(model, 'safe-nonce');
    assert.ok(html.includes("default-src 'none'")); assert.ok(!html.includes('</script><img'));
    assert.ok(html.includes('textContent')); assert.ok(!html.includes('accessToken'));
  });
  for (const scenario of Object.keys(scenarioLabels) as Array<keyof typeof scenarioLabels>) {
    it(`runs ${scenario} through authentication, transport, normalization and presentation`, async () => {
      const service = new QuotaService({ sessions: new MockSessions(scenario), transport: new MockTransport(scenario, demoClock), dataClock: demoClock }, () => {});
      await service.refresh();
      const model = createViewModel(service.current, demoClock, 'all', true, scenarioLabels[scenario], service.nextAllowedAt);
      assert.ok(model.statusText.endsWith('Demo'));
      if (scenario === 'usage-only') assert.equal(model.percentage, '—');
      if (scenario === 'incomplete') assert.equal(service.current.snapshot?.kind, 'unavailable');
      if (scenario === 'disconnected') assert.equal(service.current.phase, 'disconnected');
      service.dispose();
    });
  }
});
