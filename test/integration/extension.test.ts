import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';
import type { TestApi } from '../../src/extension';
import { scenarioLabels, type MockScenario } from '../../src/mocks';

let api: TestApi;
const original = new Map<string, unknown>();
const keys = ['dataSource', 'mockScenario', 'dayMode', 'pollIntervalMinutes', 'language', 'authProvider', 'statusStyle', 'chartStyle', 'chartMetric'];
async function waitFor(check: () => boolean) {
  const end = Date.now() + 5000;
  while (!check()) {
    if (Date.now() > end) throw new Error('The extension did not reach the expected state');
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}
async function scenario(name: MockScenario) {
  await vscode.workspace.getConfiguration('copilotPace').update('mockScenario', name, vscode.ConfigurationTarget.Global);
  await waitFor(() => api.getModel().scenario === scenarioLabels[name] && api.getState().phase !== 'loading');
  await vscode.commands.executeCommand('copilotPace.refresh');
}
function assertCurrentPace(percentage: number, display = `${percentage}%`) {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  const elapsed = now.getTime() - start;
  const projection = percentage * (end - start) / elapsed;
  const summary = elapsed < 86_400_000 ? 'Calculating pace' : projection > 100 ? 'Over pace' : projection >= 90 ? 'On track' : 'Comfortable';
  assert.equal(api.getStatus().text, `${display} · ${summary} · Demo`);
  const colors: Record<string, string> = { Comfortable: 'charts.green', 'On track': 'charts.yellow', 'Over pace': 'charts.red' };
  const color = api.getStatus().color;
  assert.equal(color instanceof vscode.ThemeColor ? color.id : color, colors[summary]);
}
describe('Copilot Pace in the Extension Development Host', () => {
  before(async () => {
    const config = vscode.workspace.getConfiguration('copilotPace');
    for (const key of keys) original.set(key, config.inspect(key)?.globalValue);
    await config.update('language', 'en', vscode.ConfigurationTarget.Global);
    await config.update('statusStyle', 'text', vscode.ConfigurationTarget.Global);
    await config.update('chartStyle', 'area', vscode.ConfigurationTarget.Global);
    await config.update('chartMetric', 'cumulative', vscode.ConfigurationTarget.Global);
    await config.update('mockScenario', '10000-comfortable', vscode.ConfigurationTarget.Global);
    await config.update('dayMode', 'all', vscode.ConfigurationTarget.Global);
    await config.update('dataSource', 'mock', vscode.ConfigurationTarget.Global);
    const extension = vscode.extensions.getExtension<TestApi>('rubenblancomanzano.copilot-pace');
    assert.ok(extension);
    api = await extension.activate();
    await waitFor(() => api.getModel().demo && api.getState().phase === 'ready' && api.getModel().percentage === '40%');
  });
  after(async () => {
    api?.dispose();
    for (const key of keys) await vscode.workspace.getConfiguration('copilotPace').update(key, original.get(key), vscode.ConfigurationTarget.Global);
  });
  it('positions the indicator on the right near Copilot', () => {
    assert.equal(api.getStatus().alignment, vscode.StatusBarAlignment.Right);
    assert.equal(api.getStatus().priority, 100.05);
    assertCurrentPace(40);
  });
  it('changes the actual status bar appearance from panel actions and validates values', async () => {
    try {
      for (const [style, prefix] of [['compact', '$(github-copilot)'], ['bar', '▰'], ['dots', '●']] as const) {
        await api.receiveMessage({ action: 'statusStyle', value: style });
        assert.equal(api.getModel().statusStyle, style);
        assert.equal(vscode.workspace.getConfiguration('copilotPace').get('statusStyle'), style);
        assert.ok(api.getStatus().text.startsWith(prefix));
        assert.ok(api.getStatus().text.includes('40%'));
      }
      await api.receiveMessage({ action: 'statusStyle', value: 'invalid' });
      assert.equal(api.getModel().statusStyle, 'dots');
      assert.equal(api.getModel().history.length, 0);
      assert.ok(api.getModel().historyMessage.includes('Demo'));
    } finally {
      await api.receiveMessage({ action: 'statusStyle', value: 'text' });
    }
  });
  it('saves chart selection without refreshing quota and rejects unsupported styles', async () => {
    const snapshot = api.getState().snapshot;
    try {
      for (const style of ['line', 'columns', 'area']) {
        await api.receiveMessage({ action: 'chartStyle', value: style });
        assert.equal(api.getModel().chartStyle, style);
        assert.equal(vscode.workspace.getConfiguration('copilotPace').get('chartStyle'), style);
        assert.equal(api.getState().snapshot, snapshot);
      }
      await api.receiveMessage({ action: 'chartStyle', value: '<script>' });
      assert.equal(api.getModel().chartStyle, 'area');
      await vscode.workspace.getConfiguration('copilotPace').update('chartStyle', 'line', vscode.ConfigurationTarget.Global);
      await waitFor(() => api.getModel().chartStyle === 'line');
    } finally {
      await api.receiveMessage({ action: 'chartStyle', value: 'area' });
    }
  });
  it('switches daily and cumulative charts without choosing a data source or changing quota', async () => {
    const snapshot = api.getState().snapshot;
    try {
      await api.receiveMessage({ action: 'chartMetric', value: 'daily' });
      assert.equal(api.getModel().chartMetric, 'daily');
      assert.equal(vscode.workspace.getConfiguration('copilotPace').get('chartMetric'), 'daily');
      assert.equal(api.getState().snapshot, snapshot);
      assert.equal(api.getModel().history.length, 0);
      await api.receiveMessage({ action: 'chartMetric', value: '<script>' });
      assert.equal(api.getModel().chartMetric, 'daily');
    } finally {
      await api.receiveMessage({ action: 'chartMetric', value: 'cumulative' });
    }
  });
  for (const [name, used, percentage] of [['10000-one-credit', 1, 0.01], ['10000-two-credits', 2, 0.02]] as const) {
    it(`shows <0.1% for ${used} credit(s) out of 10000 before hovering`, async () => {
      try {
        await scenario(name);
        assertCurrentPace(percentage, '<0.1%');
        assert.equal(api.getModel().percentage, '<0.1%');
        assert.equal(api.getModel().used, `${used} credits`);
        assert.ok(api.getTooltip()?.value.includes(' · \\<0.1% used'));
      } finally { await scenario('10000-comfortable'); }
    });
  }
  it('uses the current UTC date and month in demo mode', () => {
    const now = new Date();
    const snapshot = api.getState().snapshot;
    assert.ok(snapshot);
    assert.ok(Math.abs(snapshot.asOf - now.getTime()) < 5000);
    assert.deepEqual(snapshot.cycle, {
      start: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      end: Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    });
    const days = (snapshot.cycle!.end - now.getTime()) / 86_400_000;
    assert.ok(Math.abs(Number.parseFloat(api.getModel().daysLeft) - days) <= 0.051);
    assert.ok(Math.abs((api.getState().updatedAt ?? 0) - snapshot.asOf) < 1000);
  });
  it('registers public commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    for (const command of ['showDetails', 'refresh', 'connect', 'demo', 'useGitHub']) assert.ok(commands.includes(`copilotPace.${command}`));
  });
  it('renders a compact native hover with a restricted command allowlist', () => {
    const tooltip = api.getTooltip();
    assert.ok(tooltip instanceof vscode.MarkdownString);
    assert.equal(tooltip.supportThemeIcons, true);
    assert.equal(tooltip.supportHtml, true);
    assert.deepEqual(tooltip.isTrusted, { enabledCommands: ['copilotPace.showDetails', 'copilotPace.refresh', 'copilotPace.connect', 'copilotPace.demo'] });
    assert.ok(tooltip.value.includes('Remaining: **6,000 credits**'));
    assert.ok(!tooltip.value.includes('Today:'));
    assert.ok(!tooltip.value.includes('$(pass)'));
    assert.ok(tooltip.value.includes(`Daily allowance: **${api.getModel().allowance}** · Mon–Sun`));
    assert.ok(!tooltip.value.includes('Every day'));
    assert.equal(tooltip.value.match(/Daily allowance/g)?.length, 1);
    assert.ok(tooltip.value.includes('Projected at renewal:'));
    assert.ok(tooltip.value.includes(`Updated ${api.getModel().updated}`));
    assert.ok(!tooltip.value.includes('**Daily pace**'));
    assert.ok(!tooltip.value.includes('Cycle baseline:'));
    assert.ok(!tooltip.value.includes('GitHub account:'));
    assert.equal(api.getModel().accountLabel, '');
    assert.equal(api.getModel().canConnect, false);
  });
  it('migrates a saved 0.1.0 demo scenario to the English setting', async () => {
    const config = vscode.workspace.getConfiguration('copilotPace');
    await config.update('mockScenario', '3900-justo', vscode.ConfigurationTarget.Global);
    await waitFor(() => api.getModel().percentage === '45%' && api.getState().phase === 'ready');
    assertCurrentPace(45);
    await waitFor(() => vscode.workspace.getConfiguration('copilotPace').get('mockScenario') === '3900-on-track');
    await scenario('10000-comfortable');
  });
  it('opens and reuses the detail panel', async () => {
    await vscode.commands.executeCommand('copilotPace.showDetails');
    const panel = api.getPanel();
    assert.ok(panel);
    await waitFor(() => api.isPanelReady());
    assert.ok(panel.webview.html.includes('Simulated data'));
    assert.ok(panel.webview.html.includes('Daily pace'));
    await vscode.commands.executeCommand('copilotPace.showDetails');
    assert.equal(api.getPanel(), panel);
  });
  it('updates the calculation when switching to weekdays', async () => {
    const old = api.getModel();
    await api.receiveMessage({ action: 'dayMode', value: 'weekdays' });
    await waitFor(() => api.getModel().dayMode === 'weekdays');
    assert.ok(api.getModel().daysLeft.endsWith('weekdays left'));
    assert.ok(Number.parseFloat(api.getModel().daysLeft) <= Number.parseFloat(old.daysLeft));
    assert.equal(api.getModel().used, old.used);
    const hover = api.getTooltip()?.value ?? '';
    assert.ok(hover.includes(`Daily allowance: **${api.getModel().allowance}** · Mon–Fr`));
    assert.equal(hover.match(/Daily allowance/g)?.length, 1);
    assert.equal(hover.match(/Mon–Fr/g)?.length, 1);
    await api.receiveMessage({ action: 'dayMode', value: 'all' });
    await waitFor(() => api.getModel().dayMode === 'all');
  });
  it('ignores messages outside the allowed actions', async () => {
    await api.receiveMessage({ action: 'dayMode', value: 'invalid' });
    await api.receiveMessage({ action: 'executeCommand', value: 'workbench.action.closeWindow' });
    await api.receiveMessage(null);
    assert.equal(api.getModel().dayMode, 'all');
    await api.receiveMessage({ action: 'language', value: 'fr' });
    await api.receiveMessage({ action: 'language', value: ['es-ES'] });
    assert.equal(api.getModel().language, 'en');
  });
  it('persists Spanish from the detail panel and updates the existing view without refreshing usage', async () => {
    const panel = api.getPanel();
    assert.ok(panel);
    const snapshot = api.getState().snapshot;
    const updatedAt = api.getState().updatedAt;
    const color = api.getStatus().color;
    try {
      await api.receiveMessage({ action: 'language', value: 'es-ES' });
      await waitFor(() => api.getModel().language === 'es-ES');
      assert.equal(vscode.workspace.getConfiguration('copilotPace').inspect('language')?.globalValue, 'es-ES');
      assert.equal(api.getPanel(), panel);
      assert.equal(api.isPanelReady(), true);
      assert.equal(api.getState().snapshot, snapshot);
      assert.equal(api.getState().updatedAt, updatedAt);
      assert.deepEqual(api.getStatus().color, color);
      assert.equal(api.getModel().text.switchLanguage, 'Inglés');
      assert.ok(api.getModel().used.endsWith(' créditos'));
      assert.ok(api.getTooltip()?.value.includes('[$(graph) Ver detalles]'));
      assert.ok(api.getTooltip()?.value.includes(api.getModel().dayMode === 'weekdays' ? 'De lunes a viernes' : 'De lunes a domingo'));
      assert.ok(!api.getTooltip()?.value.includes('[Inglés]'));
      assert.ok(!api.getTooltip()?.value.includes('[Spanish]'));
      await api.receiveMessage({ action: 'language', value: 'en' });
      await waitFor(() => api.getModel().language === 'en');
      assert.equal(api.getModel().text.switchLanguage, 'Spanish');
      assert.equal(api.getState().snapshot, snapshot);
    } finally { await api.receiveMessage({ action: 'language', value: 'en' }); }
  });
  it('colors the status and native hover according to the current pace for each budget', async () => {
    for (const [name, used] of [['3900-on-track', 45], ['3900-over-pace', 60], ['budget-10000', 19.5]] as const) {
      await scenario(name);
      assertCurrentPace(used);
      const color = api.getStatus().color;
      if (color instanceof vscode.ThemeColor) {
        assert.ok(api.getTooltip()?.value.includes(`color:var(--vscode-${color.id.replace('.', '-')});`));
      } else assert.ok(!api.getTooltip()?.value.includes('<span'));
    }
  });
  it('changes the budget without increasing accumulated usage', async () => {
    await scenario('budget-3900');
    const used = api.getModel().used;
    assert.equal(api.getModel().percentage, '50%');
    await scenario('budget-10000');
    assert.equal(api.getModel().used, used);
    assert.equal(api.getModel().percentage, '19.5%');
  });
  it('handles exhausted, unknown, incomplete, disconnected and error scenarios', async () => {
    const expected: Record<string, string> = { exhausted: 'ready', 'usage-only': 'ready', incomplete: 'ready', disconnected: 'disconnected', timeout: 'error', '401': 'error', '403': 'error', '429': 'error', '500': 'error' };
    for (const [name, phase] of Object.entries(expected)) {
      await scenario(name as MockScenario);
      assert.equal(api.getState().phase, phase, name);
      assert.ok(api.getStatus().text.endsWith('Demo'));
      if (name !== 'exhausted') assert.equal(api.getStatus().color, undefined, name);
      if (name !== 'exhausted') assert.ok(!api.getTooltip()?.value.includes('<span'), name);
    }
  });
  it('recovers from an error without retaining previous data or cooldown', async () => {
    await scenario('10000-comfortable');
    assertCurrentPace(40);
    await api.receiveMessage({ action: 'refresh' });
    assert.equal(api.getState().phase, 'ready');
    await api.receiveMessage({ action: 'connect' });
    assert.equal(api.getState().phase, 'ready');
  });
  it('creates a new panel after closing the old one', async () => {
    const panel = api.getPanel();
    assert.ok(panel);
    panel.dispose();
    await waitFor(() => api.getPanel() === undefined);
    await vscode.commands.executeCommand('copilotPace.showDetails');
    assert.notEqual(api.getPanel(), panel);
    await waitFor(() => api.isPanelReady());
  });
  it('clears demo data when returning to GitHub and never falls back to mocks', async () => {
    await vscode.commands.executeCommand('copilotPace.useGitHub');
    await waitFor(() => !api.getModel().demo && api.getState().phase === 'disconnected');
    assert.equal(api.getState().snapshot, undefined);
    assert.ok(!api.getStatus().text.includes('Demo'));
    assert.equal(api.getModel().accountLabel, '');
    assert.equal(api.getModel().connectLabel, 'Connect GitHub');
    assert.ok(api.getTooltip()?.value.includes('[Connect GitHub](command:copilotPace.connect)'));
    assert.equal(api.getStatus().color, undefined);
    await vscode.workspace.getConfiguration('copilotPace').update('dataSource', 'mock', vscode.ConfigurationTarget.Global);
    await waitFor(() => api.getModel().demo && api.getState().phase === 'ready' && api.getModel().percentage === '40%');
    assertCurrentPace(40);
  });
  it('reports missing Enterprise configuration and returns to normal GitHub.com without an interactive login', async () => {
    const config = vscode.workspace.getConfiguration('copilotPace');
    try {
      await config.update('authProvider', 'github-enterprise', vscode.ConfigurationTarget.Global);
      await config.update('dataSource', 'github', vscode.ConfigurationTarget.Global);
      await waitFor(() => !api.getModel().demo && api.getState().failure?.code === 'configuration');
      assert.equal(api.getState().snapshot, undefined);
      assert.ok(api.getModel().message.includes('HTTPS'));
      await config.update('language', 'es-ES', vscode.ConfigurationTarget.Global);
      await waitFor(() => api.getModel().language === 'es-ES');
      assert.ok(api.getModel().message.includes('GitHub Enterprise'));
      await config.update('authProvider', 'github', vscode.ConfigurationTarget.Global);
      await waitFor(() => api.getState().phase === 'disconnected');
      assert.equal(api.getState().snapshot, undefined);
      assert.equal(api.getModel().accountLabel, '');
    } finally {
      await config.update('language', 'en', vscode.ConfigurationTarget.Global);
      await config.update('authProvider', original.get('authProvider'), vscode.ConfigurationTarget.Global);
      await config.update('dataSource', 'mock', vscode.ConfigurationTarget.Global);
      await waitFor(() => api.getModel().demo && api.getState().phase === 'ready');
    }
  });
});
