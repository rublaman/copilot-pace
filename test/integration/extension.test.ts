import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';
import type { TestApi } from '../../src/extension';
import { scenarioLabels, type MockScenario } from '../../src/mocks';

let api: TestApi;
const original = new Map<string, unknown>();
const keys = ['dataSource', 'mockScenario', 'dayMode', 'pollIntervalMinutes'];
async function waitFor(check: () => boolean) {
  const end = Date.now() + 5000;
  while (!check()) { if (Date.now() > end) throw new Error('The extension did not reach the expected state'); await new Promise(resolve => setTimeout(resolve, 20)); }
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
    await config.update('mockScenario', '10000-comfortable', vscode.ConfigurationTarget.Global);
    await config.update('dayMode', 'all', vscode.ConfigurationTarget.Global);
    await config.update('dataSource', 'mock', vscode.ConfigurationTarget.Global);
    const extension = vscode.extensions.getExtension<TestApi>('rubenblancomanzano.copilot-pace');
    assert.ok(extension); api = await extension.activate();
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
  for (const [name, used, percentage] of [['10000-one-credit', 1, 0.01], ['10000-two-credits', 2, 0.02]] as const) {
    it(`shows <0.1% for ${used} credit(s) out of 10000 before hovering`, async () => {
      try {
        await scenario(name);
        assertCurrentPace(percentage, '<0.1%');
        assert.equal(api.getModel().percentage, '<0.1%');
        assert.equal(api.getModel().used, `${used} credits`);
        assert.ok(api.getTooltip()?.value.includes('Credits used: **\\<0.1%**'));
      } finally { await scenario('10000-comfortable'); }
    });
  }
  it('uses the current UTC date and month in demo mode', () => {
    const now = new Date();
    const snapshot = api.getState().snapshot; assert.ok(snapshot);
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
  it('renders a rich native hover with a restricted command allowlist', () => {
    const tooltip = api.getTooltip(); assert.ok(tooltip instanceof vscode.MarkdownString);
    assert.equal(tooltip.supportThemeIcons, true); assert.equal(tooltip.supportHtml, false);
    assert.deepEqual(tooltip.isTrusted, { enabledCommands: ['copilotPace.showDetails', 'copilotPace.refresh', 'copilotPace.connect', 'copilotPace.demo'] });
    assert.ok(tooltip.value.includes('Remaining: **6,000 credits**'));
    assert.ok(tooltip.value.includes('**Daily pace**'));
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
    const panel = api.getPanel(); assert.ok(panel);
    await waitFor(() => api.isPanelReady());
    assert.ok(panel.webview.html.includes('Simulated data')); assert.ok(panel.webview.html.includes('Daily pace'));
    await vscode.commands.executeCommand('copilotPace.showDetails'); assert.equal(api.getPanel(), panel);
  });
  it('updates the calculation when switching to weekdays', async () => {
    const old = api.getModel();
    await api.receiveMessage({ action: 'dayMode', value: 'weekdays' });
    await waitFor(() => api.getModel().dayMode === 'weekdays');
    assert.ok(api.getModel().daysLeft.endsWith('weekdays left'));
    assert.ok(Number.parseFloat(api.getModel().daysLeft) <= Number.parseFloat(old.daysLeft));
    assert.equal(api.getModel().used, old.used);
    await api.receiveMessage({ action: 'dayMode', value: 'all' });
    await waitFor(() => api.getModel().dayMode === 'all');
  });
  it('ignores messages outside the allowed actions', async () => {
    await api.receiveMessage({ action: 'dayMode', value: 'invalid' });
    await api.receiveMessage({ action: 'executeCommand', value: 'workbench.action.closeWindow' });
    await api.receiveMessage(null); assert.equal(api.getModel().dayMode, 'all');
  });
  it('colors the status according to the current pace for each budget', async () => {
    await scenario('3900-on-track'); assertCurrentPace(45);
    await scenario('3900-over-pace'); assertCurrentPace(60);
    await scenario('budget-10000'); assertCurrentPace(19.5);
  });
  it('changes the budget without increasing accumulated usage', async () => {
    await scenario('budget-3900'); const used = api.getModel().used;
    assert.equal(api.getModel().percentage, '50%');
    await scenario('budget-10000'); assert.equal(api.getModel().used, used); assert.equal(api.getModel().percentage, '19.5%');
  });
  it('handles exhausted, unknown, incomplete, disconnected and error scenarios', async () => {
    const expected: Record<string, string> = { exhausted: 'ready', 'usage-only': 'ready', incomplete: 'ready', disconnected: 'disconnected', timeout: 'error', '401': 'error', '403': 'error', '429': 'error', '500': 'error' };
    for (const [name, phase] of Object.entries(expected)) {
      await scenario(name as MockScenario); assert.equal(api.getState().phase, phase, name); assert.ok(api.getStatus().text.endsWith('Demo'));
      if (name !== 'exhausted') assert.equal(api.getStatus().color, undefined, name);
    }
  });
  it('recovers from an error without retaining previous data or cooldown', async () => {
    await scenario('10000-comfortable'); assertCurrentPace(40);
    await api.receiveMessage({ action: 'refresh' }); assert.equal(api.getState().phase, 'ready');
    await api.receiveMessage({ action: 'connect' }); assert.equal(api.getState().phase, 'ready');
  });
  it('creates a new panel after closing the old one', async () => {
    const panel = api.getPanel(); assert.ok(panel); panel.dispose();
    await waitFor(() => api.getPanel() === undefined);
    await vscode.commands.executeCommand('copilotPace.showDetails'); assert.notEqual(api.getPanel(), panel);
    await waitFor(() => api.isPanelReady());
  });
  it('clears demo data when returning to GitHub and never falls back to mocks', async () => {
    await vscode.commands.executeCommand('copilotPace.useGitHub');
    await waitFor(() => !api.getModel().demo && api.getState().phase === 'disconnected');
    assert.equal(api.getState().snapshot, undefined); assert.ok(!api.getStatus().text.includes('Demo'));
    assert.equal(api.getModel().accountLabel, '');
    assert.equal(api.getModel().connectLabel, 'Connect GitHub');
    assert.ok(api.getTooltip()?.value.includes('[Connect GitHub](command:copilotPace.connect)'));
    assert.equal(api.getStatus().color, undefined);
    await vscode.workspace.getConfiguration('copilotPace').update('dataSource', 'mock', vscode.ConfigurationTarget.Global);
    await waitFor(() => api.getModel().demo && api.getState().phase === 'ready' && api.getModel().percentage === '40%');
    assertCurrentPace(40);
  });
});
