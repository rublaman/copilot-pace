import * as assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { normalizeQuota } from '../../src/domain';
import { boundedFixture, MockSessions, MockTransport, resolveScenario, scenarioLabels } from '../../src/mocks';
import { demoClock } from '../fixtures';
import { createViewModel, renderHtml, renderHover, hoverCommands, type ViewModel } from '../../src/presentation';
import { QuotaService } from '../../src/service';
import { SafeError } from '../../src/transport';

function panelElements(model: ViewModel, updates: ViewModel[] = [], messages: unknown[] = []) {
  const elements = new Map<string, { textContent: string; hidden?: boolean; disabled?: boolean; attributes: Map<string, string>; setAttribute(key: string, value: string): void; addEventListener(event: string, listener: () => void): void; click(): void }>();
  const html = renderHtml(model, 'safe-nonce');
  for (const [, id] of html.matchAll(/id="([\w]+)"/g)) {
    const attributes = new Map<string, string>();
    const listeners = new Map<string, () => void>();
    elements.set(id!, { textContent: '', attributes, setAttribute: (key, value) => { attributes.set(key, value); }, addEventListener: (event, listener) => { listeners.set(event, listener); }, click: () => listeners.get('click')?.() });
  }
  const script = html.match(/<script nonce="safe-nonce">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  let update!: (event: { data: { type: string; model: ViewModel } }) => void;
  runInNewContext(script, {
    acquireVsCodeApi: () => ({ postMessage: (message: unknown) => messages.push(message) }),
    document: { getElementById: (id: string) => elements.get(id) },
    window: { addEventListener: (_event: string, listener: typeof update) => { update = listener; } },
  });
  for (const next of updates) update({ data: { type: 'state', model: next } });
  return elements;
}

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
    const hover = renderHover(model);
    assert.ok(!hover.includes('Today:'));
    assert.ok(hover.includes('Daily allowance: **375 / day** · Mon–Sun'));
    assert.ok(!hover.includes('Every day'));
    assert.equal(hover.match(/Daily allowance/g)?.length, 1);
    assert.ok(!hover.includes('266.7 / day'));
  });
  it('uses eligible weekdays for the baseline, allowance and progress', () => {
    const model = createViewModel({ phase: 'ready', snapshot }, demoClock, 'weekdays', true, 'Demo', 0);
    assert.equal(model.daysLeft, '11 weekdays left');
    assert.equal(model.cycleProgress, '50%');
    assert.equal(model.dailyAverage, '363.6 / day');
    assert.equal(model.allowance, '545.5 / day');
    const hover = renderHover(model);
    assert.ok(hover.includes('Daily allowance: **545.5 / day** · Mon–Fr'));
    assert.equal(hover.match(/Mon–Fr/g)?.length, 1);
  });
  it('does not invent an allowance for an unknown budget or expired cycle', () => {
    for (const state of [
      { kind: 'usageOnly' as const, used: 15, asOf: 0 },
      { kind: 'bounded' as const, used: 15, total: 20, usedPercent: 75, asOf: 0, cycle: { start: 0, end: 86400000 } },
    ]) {
      const model = createViewModel({ phase: 'ready', snapshot: state }, demoClock, 'all', false, '', 0);
      assert.equal(model.allowance, '—'); assert.equal(model.cycleValue, null); assert.equal(model.projection, '—');
      assert.ok(!renderHover(model).includes('Daily allowance'));
      assert.ok(!renderHover(model).includes('Today:'));
    }
  });
  it('keeps early-cycle averages pending and exhausted allowances at zero', () => {
    const early = createViewModel({ phase: 'ready', snapshot }, { now: () => new Date('2026-10-01T12:00Z') }, 'all', true, 'Demo', 0);
    assert.equal(early.dailyAverage, '—'); assert.equal(early.summary, 'Calculating pace');
    const exhausted = createViewModel({ phase: 'ready', snapshot: normalizeQuota(boundedFixture(3900, 3900, demoClock.now()), demoClock.now()) }, demoClock, 'all', true, 'Demo', 0);
    assert.equal(exhausted.remaining, '0 credits'); assert.equal(exhausted.allowance, '0 / day');
    assert.ok(renderHover(exhausted).includes('Daily allowance: **0 / day** · Mon–Sun'));
    assert.ok(renderHover(early).includes('A daily estimate will appear after one full eligible day.'));
  });
  it('keeps a compact hover while retaining the breakdown in the detail panel', () => {
    const model = createViewModel({ phase: 'ready', snapshot, updatedAt: demoClock.now().getTime() }, demoClock, 'weekdays', false, '', 0);
    const hover = renderHover(model);
    assert.ok(hover.includes(`✓ **${model.summary}**</span> · 40% used`));
    assert.ok(!hover.includes('$(pass)'));
    assert.ok(hover.includes('Remaining: **6,000 credits**'));
    assert.ok(!hover.includes('Today:'));
    assert.ok(hover.includes('Daily allowance: **545.5 / day** · Mon–Fr'));
    assert.ok(hover.includes(`Projected at renewal: **${model.projection.replace(/[()]/g, '\\$&')}**`));
    assert.ok(hover.includes(`Updated ${model.updated}`));
    assert.ok(!hover.includes(model.forecastNote));
    for (const detail of ['**This cycle**', '**Progress**', '**Daily pace**', 'Average:', 'Available:', 'Cycle baseline:', 'Renewal:', 'Time left:']) {
      assert.ok(!hover.includes(detail), `Hover repeats detail: ${detail}`);
    }
    const elements = panelElements(model);
    for (const key of ['dailyAverage', 'allowance', 'baseRate', 'cycleProgress', 'daysLeft', 'renewal'] as const) {
      assert.equal(elements.get(key)?.textContent, model[key]);
    }
  });
  it('retains stale-data warnings and retry guidance in the compact hover', () => {
    const retryAt = demoClock.now().getTime() + 120_000;
    const failure = new SafeError('rateLimited', 'GitHub has limited requests.', retryAt);
    const model = createViewModel({ phase: 'error', snapshot, updatedAt: demoClock.now().getTime(), failure }, demoClock, 'all', false, '', retryAt);
    const hover = renderHover(model);
    assert.ok(hover.includes('**Out of date**'));
    assert.ok(hover.includes(failure.message));
    assert.ok(hover.includes(model.retry));
    assert.ok(hover.includes(`Updated ${model.updated}`));
  });
  it('escapes untrusted Markdown and only inserts fixed action links', () => {
    const model = createViewModel({ phase: 'ready', snapshot }, demoClock, 'all', true, 'Demo', 0);
    model.message = '[run](command:evil) <img> | $(warning)\nextra';
    const hover = renderHover(model);
    assert.ok(hover.includes('Projected at renewal:')); assert.ok(hover.includes('6,000 credits'));
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
  for (const [used, percentage] of [[0, '0%'], [1, '<0.1%'], [2, '<0.1%'], [4, '<0.1%'], [6, '0.1%'], [10, '0.1%'], [40, '0.4%'], [1234, '12.3%'], [1950, '19.5%'], [10000, '100%']] as const) {
    for (const source of ['native percentage', 'remaining credits'] as const) {
      it(`shows ${used}/10000 as ${percentage} from ${source} in the status bar, hover and panel`, () => {
        const body = boundedFixture(10000, used, demoClock.now()) as { quota_snapshots: { premium_interactions: { percent_remaining?: number } } };
        if (source === 'remaining credits') delete body.quota_snapshots.premium_interactions.percent_remaining;
        const snapshot = normalizeQuota(body, demoClock.now());
        const model = createViewModel({ phase: 'ready', snapshot }, demoClock, 'all', false, '', 0);
        assert.equal(model.percentage, percentage);
        if (used > 0) assert.ok(!model.projection.includes('(0%)'));
        assert.ok(model.statusText.startsWith(`${percentage} · `));
        assert.ok(renderHover(model).includes(` · ${percentage.replace('<', '\\<')} used`));
        const elements = panelElements(model);
        assert.equal(elements.get('percentage')?.textContent, percentage);
        assert.equal(elements.get('usageLabel')?.textContent, percentage);
        assert.equal(elements.get('usageBar')?.attributes.get('aria-valuetext'), percentage.replace('%', ' percent').replace('<', 'Less than '));
      });
    }
  }
  it('does not round positive usage below the display precision to zero', () => {
    const snapshot = normalizeQuota(boundedFixture(100000, 1, demoClock.now()), demoClock.now());
    const model = createViewModel({ phase: 'ready', snapshot }, demoClock, 'all', false, '', 0);
    assert.equal(model.percentage, '<0.1%');
    assert.ok(model.projection.includes('(<0.1%)'));
    assert.ok(model.statusText.startsWith('<0.1% · '));
    assert.ok(renderHover(model).includes(' · \\<0.1% used'));
    assert.ok(renderHtml(model, 'safe-nonce').includes('"percentage":"\\u003c0.1%"'));
    const elements = panelElements(model);
    assert.equal(elements.get('percentage')?.textContent, '<0.1%');
    assert.equal(elements.get('usageBar')?.attributes.get('aria-valuetext'), 'Less than 0.1 percent');
  });
  it('explains the GitHub connection without inventing usage', () => {
    const model = createViewModel({ phase: 'disconnected' }, demoClock, 'all', false, '', 0);
    assert.equal(model.message, 'Connect GitHub to view your Copilot usage.');
    assert.equal(model.percentage, '—');
    assert.ok(!renderHover(model).includes('Today:'));
    assert.ok(!renderHover(model).includes('Daily allowance'));
  });
  it('uses the same account action in the hover and panel for each connection state', () => {
    const account = { id: 'account', label: 'Test' };
    for (const [state, label, displayedAccount] of [
      [{ phase: 'disconnected' }, 'Connect GitHub', ''],
      [{ phase: 'loading' }, 'Connect GitHub', ''],
      [{ phase: 'error', failure: new SafeError('auth', 'Cancelled') }, 'Connect GitHub', ''],
      [{ phase: 'ready', snapshot, account }, 'Switch GitHub account…', 'Test'],
      [{ phase: 'loading', snapshot, account }, 'Switch GitHub account…', 'Test'],
      [{ phase: 'error', snapshot, account, failure: new SafeError('timeout', 'Timeout') }, 'Switch GitHub account…', 'Test'],
      [{ phase: 'error', account, failure: new SafeError('forbidden', 'Forbidden') }, 'Switch GitHub account…', 'Test'],
      [{ phase: 'error', account, failure: new SafeError('unauthorized', 'Expired') }, 'Reconnect GitHub', 'Test'],
      [{ phase: 'error', account, failure: new SafeError('auth', 'Cancelled') }, 'Reconnect GitHub', 'Test'],
    ] as const) {
      const model = createViewModel(state, demoClock, 'all', false, '', 0);
      assert.equal(model.connectLabel, label); assert.equal(model.accountLabel, displayedAccount);
      assert.ok(!renderHover(model).includes('Today:'));
      assert.ok(renderHover(model).includes(`[${label}](command:copilotPace.connect)`));
      assert.equal(renderHover(model).includes('GitHub account:'), !!displayedAccount);
      const elements = panelElements(model);
      assert.equal(elements.get('connect')?.textContent, label);
      assert.equal(elements.get('connect')?.disabled, state.phase === 'loading');
      assert.equal(elements.get('accountLabel')?.textContent, displayedAccount);
      assert.equal(elements.get('accountLabel')?.hidden, !displayedAccount);
      assert.equal(elements.get('accountHeading')?.hidden, !displayedAccount);
    }
  });
  it('updates account identity and actions in an already open panel', () => {
    const disconnected = createViewModel({ phase: 'disconnected' }, demoClock, 'all', false, '', 0);
    const first = createViewModel({ phase: 'ready', snapshot, account: { id: 'first', label: 'First' } }, demoClock, 'all', false, '', 0);
    const second = createViewModel({ phase: 'ready', snapshot, account: { id: 'second', label: 'Second' } }, demoClock, 'all', false, '', 0);
    let elements = panelElements(disconnected, [first, second]);
    assert.equal(elements.get('accountLabel')?.textContent, 'Second');
    assert.equal(elements.get('accountLabel')?.hidden, false);
    assert.equal(elements.get('connect')?.textContent, 'Switch GitHub account…');
    elements = panelElements(first, [second, disconnected]);
    assert.equal(elements.get('accountLabel')?.textContent, '');
    assert.equal(elements.get('accountLabel')?.hidden, true);
    assert.equal(elements.get('connect')?.textContent, 'Connect GitHub');
  });
  it('omits unsupported model-usage UI for connected accounts and demos in both languages', () => {
    for (const language of ['en', 'es-ES'] as const) {
      for (const demo of [false, true]) {
        const model = createViewModel({ phase: 'ready', snapshot, account: { id: 'account', label: 'Test' } }, demoClock, 'all', demo, '', 0, language);
        const html = renderHtml(model, 'safe-nonce');
        assert.equal(panelElements(model).has('modelUsage'), false);
        assert.ok(!html.includes('Model usage'));
        assert.ok(!html.includes('Consumo por modelo'));
        assert.ok(!html.includes('0 tokens'));
        assert.ok(!html.includes('Top 5'));
      }
    }
  });
  it('escapes account labels in the hover and renders them as text in the panel', () => {
    const label = '[run](command:evil) </script><img src=x onerror=alert(1)> $(warning)\nOther';
    const model = createViewModel({ phase: 'ready', snapshot, account: { id: 'account', label } }, demoClock, 'all', false, '', 0);
    const hover = renderHover(model);
    assert.ok(!hover.includes('[run](command:evil)')); assert.ok(!hover.includes('$(warning)'));
    assert.ok(hover.includes('\\[run\\]\\(command:evil\\)'));
    assert.ok(!renderHtml(model, 'safe-nonce').includes('</script><img'));
    assert.equal(panelElements(model).get('accountLabel')?.textContent, label);
  });
  it('hides account identity and connection controls for synthetic demos', () => {
    const model = createViewModel({ phase: 'ready', snapshot, account: { id: 'synthetic', label: 'Demo' } }, demoClock, 'all', true, 'Demo', 0);
    assert.equal(model.accountLabel, ''); assert.equal(model.canConnect, false);
    assert.ok(!renderHover(model).includes('GitHub account:'));
    assert.ok(renderHover(model).includes('[Change demo](command:copilotPace.demo)'));
    const elements = panelElements(model);
    assert.equal(elements.get('accountLabel')?.hidden, true);
    assert.equal(elements.get('connect')?.hidden, true);
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
  it('updates pace colors in the hover and an open panel, clearing them for stale or missing data', () => {
    for (const language of ['en', 'es-ES'] as const) {
      const neutral = createViewModel({ phase: 'disconnected' }, demoClock, 'all', false, '', 0, language);
      let previous = neutral;
      for (const [used, tone, color] of [[4000, 'good', 'green'], [4500, 'watch', 'yellow'], [6000, 'over', 'red']] as const) {
        const snapshot = normalizeQuota(boundedFixture(10000, used, demoClock.now()), demoClock.now());
        const current = createViewModel({ phase: 'ready', snapshot }, demoClock, 'all', false, '', 0, language);
        const hover = renderHover(current);
        assert.ok(hover.includes(`<span style="color:var(--vscode-charts-${color});">`));
        assert.equal(panelElements(previous, [current]).get('content')?.attributes.get('data-tone'), tone);
        const stale = createViewModel({ phase: 'error', snapshot, failure: new SafeError('network', 'Network unavailable') }, demoClock, 'all', false, '', 0, language);
        assert.ok(!renderHover(stale).includes('<span'));
        assert.equal(panelElements(current, [stale]).get('content')?.attributes.get('data-tone'), 'neutral');
        previous = current;
      }
      assert.ok(!renderHover(neutral).includes('<span'));
      assert.equal(panelElements(previous, [neutral]).get('content')?.attributes.get('data-tone'), 'neutral');
    }
  });
  it('keeps HTML and command payloads escaped inside the colored status label', () => {
    const model = createViewModel({ phase: 'ready', snapshot }, demoClock, 'all', false, '', 0);
    model.summary = '</span><img src=x onerror=alert(1)> [run](command:evil) $(warning)';
    const hover = renderHover(model);
    assert.equal(hover.match(/<span /g)?.length, 1);
    assert.equal(hover.match(/<\/span>/g)?.length, 1);
    assert.ok(!/(?<!\\)<img/.test(hover));
    assert.ok(!hover.includes('[run](command:evil)'));
    assert.ok(hover.includes('\\<img'));
    assert.ok(hover.includes('\\$\\(warning\\)'));
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
  it('localizes Spanish figures, dates, states and hover without a language action in the hover', () => {
    const spanish = createViewModel({ phase: 'ready', snapshot, updatedAt: demoClock.now().getTime(), account: { id: 'test', label: 'Test' } }, demoClock, 'weekdays', false, '', 0, 'es-ES');
    assert.equal(spanish.summary, 'Con margen');
    assert.equal(spanish.used, '4000 créditos');
    assert.equal(spanish.total, '10.000 créditos');
    assert.equal(spanish.allowance, '545,5 / día');
    assert.equal(spanish.period, 'octubre de 2026');
    assert.ok(spanish.updated.endsWith(' UTC'));
    assert.equal(spanish.connectLabel, 'Cambiar cuenta de GitHub…');
    const hover = renderHover(spanish);
    assert.ok(hover.includes('✓ **Con margen**'));
    assert.ok(hover.includes('Disponible por día: **545,5 / día** · De lunes a viernes'));
    const everyDay = createViewModel({ phase: 'ready', snapshot }, demoClock, 'all', false, '', 0, 'es-ES');
    assert.ok(renderHover(everyDay).includes('Disponible por día: **375 / día** · De lunes a domingo'));
    assert.ok(!renderHover(everyDay).includes('Todos los días'));
    assert.ok(hover.includes('Previsión al renovar:'));
    assert.ok(hover.includes('[$(graph) Ver detalles](command:copilotPace.showDetails)'));
    assert.ok(!hover.includes('Daily allowance'));
    assert.ok(!hover.includes('[Inglés]')); assert.ok(!hover.includes('[Spanish]'));
    assert.ok(!hover.includes('Today:'));
    assert.deepEqual(snapshot, normalizeQuota(boundedFixture(10000, 4000, demoClock.now()), demoClock.now()));
  });
  it('switches the live panel language and sends the next language from the visible button', () => {
    const english = createViewModel({ phase: 'ready', snapshot }, demoClock, 'all', false, '', 0);
    const spanish = createViewModel({ phase: 'ready', snapshot }, demoClock, 'all', false, '', 0, 'es-ES');
    const messages: unknown[] = [];
    let elements = panelElements(english, [], messages);
    assert.equal(elements.get('language')?.textContent, 'Spanish');
    elements.get('language')?.click();
    elements = panelElements(english, [spanish], messages);
    assert.equal(elements.get('page')?.attributes.get('lang'), 'es-ES');
    assert.equal(elements.get('language')?.textContent, 'Inglés');
    assert.equal(elements.get('language')?.attributes.get('aria-label'), 'Cambiar a inglés');
    assert.equal(elements.get('refresh')?.textContent, 'Actualizar consumo');
    assert.equal(elements.get('paceHeading')?.textContent, 'Ritmo diario');
    assert.equal(elements.get('all')?.textContent, 'Todos los días');
    elements.get('language')?.click();
    assert.deepEqual(messages.filter(message => (message as { action: string }).action === 'language').map(message => ({ ...(message as object) })), [
      { action: 'language', value: 'es-ES' }, { action: 'language', value: 'en' },
    ]);
    elements = panelElements(spanish, [english]);
    assert.equal(elements.get('page')?.attributes.get('lang'), 'en');
    assert.equal(elements.get('language')?.textContent, 'Spanish');
    assert.equal(elements.get('paceHeading')?.textContent, 'Daily pace');
  });
  it('keeps tiny positive percentages and their accessible labels in Spanish', () => {
    const tiny = normalizeQuota(boundedFixture(10000, 1, demoClock.now()), demoClock.now());
    const model = createViewModel({ phase: 'ready', snapshot: tiny }, demoClock, 'all', false, '', 0, 'es-ES');
    assert.equal(model.percentage, '<0,1%');
    assert.ok(renderHover(model).includes('\\<0,1% consumido'));
    const elements = panelElements(model);
    assert.equal(elements.get('usageBar')?.attributes.get('aria-valuetext'), 'Menos de 0,1 por ciento');
    assert.ok(!elements.get('cycleBar')?.attributes.get('aria-valuetext')?.includes('.'));
  });
  it('translates recovery messages, quota reasons and cooldowns in Spanish', () => {
    for (const [code, expected] of [
      ['timeout', 'tiempo de espera'], ['network', 'proxy'], ['invalidResponse', 'no compatible'],
      ['unauthorized', 'Vuelve a conectar'], ['forbidden', 'no permite'], ['rateLimited', 'limitado'],
      ['server', 'HTTP 503'], ['cancelled', 'cancelada'], ['auth', 'autorización'],
    ] as const) {
      const failure = new SafeError(code, 'Usage is currently unavailable (HTTP 503).');
      const model = createViewModel({ phase: 'error', failure }, demoClock, 'all', false, '', demoClock.now().getTime() + 60_000, 'es-ES');
      assert.ok(model.message.includes(expected), `${code}: ${model.message}`);
      assert.ok(model.retry.startsWith('Próxima actualización permitida:'));
    }
    const unavailable = normalizeQuota({}, demoClock.now());
    const model = createViewModel({ phase: 'ready', snapshot: unavailable }, demoClock, 'all', false, '', 0, 'es-ES');
    assert.equal(model.summary, 'Cuota no disponible');
    assert.ok(model.message.includes('cuota de créditos compatible'));
    const disconnected = createViewModel({ phase: 'disconnected' }, demoClock, 'all', false, '', 0, 'es-ES');
    assert.equal(disconnected.connectLabel, 'Conectar con GitHub');
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
