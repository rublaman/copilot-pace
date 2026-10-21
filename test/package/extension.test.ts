import * as assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import * as vscode from 'vscode';
import type { TestApi } from '../../src/extension';

let api: TestApi;
let extension: vscode.Extension<TestApi>;
let settingsPath: string;
let originalSettings: string;
async function waitFor(check: () => boolean) {
  const end = Date.now() + 5000;
  while (!check()) {
    if (Date.now() > end) throw new Error('The production extension did not reach the expected state');
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}

describe('Installed production VSIX', () => {
  before(async () => {
    assert.ok(process.env.COPILOT_PACE_TEST_SETTINGS, 'Run package tests via npm run test:package');
    settingsPath = process.env.COPILOT_PACE_TEST_SETTINGS;
    originalSettings = await readFile(settingsPath, 'utf8');
    assert.equal(vscode.workspace.getConfiguration('copilotPace').get('dataSource'), 'mock');
    assert.equal(vscode.workspace.getConfiguration('copilotPace').get('mockScenario'), '3900-justo');
    const installed = vscode.extensions.getExtension<TestApi>('rubenblancomanzano.copilot-pace');
    assert.ok(installed);
    extension = installed;
    api = await extension.activate();
    await waitFor(() => api.getState().phase !== 'loading');
  });
  after(async () => {
    api?.dispose();
    if (originalSettings !== undefined) await writeFile(settingsPath, originalSettings);
  });
  it('ships only user-facing commands and settings in its manifest', async () => {
    const manifest = JSON.parse(await readFile(vscode.Uri.joinPath(extension.extensionUri, 'package.json').fsPath, 'utf8'));
    assert.deepEqual(manifest.contributes.commands.map((item: { command: string }) => item.command), [
      'copilotPace.showDetails', 'copilotPace.refresh', 'copilotPace.connect',
    ]);
    assert.deepEqual(Object.keys(manifest.contributes.configuration.properties).sort(), ['copilotPace.authProvider', 'copilotPace.chartMetric', 'copilotPace.chartStyle', 'copilotPace.dayMode', 'copilotPace.language', 'copilotPace.pollIntervalMinutes', 'copilotPace.statusStyle']);
    assert.equal(manifest.contributes.configuration.properties['copilotPace.chartMetric'].default, 'cumulative');
    assert.deepEqual(manifest.contributes.configuration.properties['copilotPace.chartMetric'].enum, ['cumulative', 'daily']);
    assert.equal(manifest.contributes.configuration.properties['copilotPace.chartStyle'].default, 'line');
    assert.deepEqual(manifest.contributes.configuration.properties['copilotPace.chartStyle'].enum, ['line', 'columns']);
    assert.equal(manifest.contributes.configuration.properties['copilotPace.statusStyle'].default, 'text');
    assert.deepEqual(manifest.contributes.configuration.properties['copilotPace.statusStyle'].enum, ['text', 'compact', 'bar', 'dots']);
    assert.equal(manifest.contributes.configuration.properties['copilotPace.authProvider'].default, 'auto');
    assert.deepEqual(manifest.contributes.configuration.properties['copilotPace.authProvider'].enum, ['auto', 'github', 'github-enterprise']);
    assert.equal(manifest.contributes.configuration.properties['copilotPace.language'].default, 'en');
    assert.deepEqual(manifest.contributes.configuration.properties['copilotPace.language'].enum, ['en', 'es-ES']);
  });
  it('contains no demo adapters, scenarios or demo command identifiers', async () => {
    const bundle = await readFile(vscode.Uri.joinPath(extension.extensionUri, 'dist', 'extension.js').fsPath, 'utf8');
    for (const marker of ['synthetic-session', 'synthetic-not-a-credential', '10000-comfortable', '10000-one-credit', '10000-two-credits', '3900-on-track', 'copilotPace.demo', 'copilotPace.useGitHub', 'mockScenario', 'Simulated data']) {
      assert.ok(!bundle.includes(marker), `Production bundle includes ${marker}`);
    }
  });
  it('ignores saved mock settings even when the production bundle runs in a test host', () => {
    assert.equal(api.getModel().demo, false);
    assert.equal(api.getModel().scenario, '');
    assert.equal(api.getState().phase, 'disconnected');
    assert.equal(api.getState().snapshot, undefined);
    assert.equal(api.getStatus().text, 'Connect GitHub');
    assert.equal(vscode.workspace.getConfiguration('copilotPace').get('mockScenario'), '3900-justo');
  });
  it('does not register demos or allow direct execution of their commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    for (const command of ['copilotPace.demo', 'copilotPace.useGitHub']) {
      assert.ok(!commands.includes(command));
      await assert.rejects(async () => vscode.commands.executeCommand(command), /not found/);
    }
  });
  it('keeps real mode after changing old settings and refreshing', async () => {
    for (const scenario of ['10000-comfortable', 'timeout', 'disconnected']) {
      const settings = JSON.parse(await readFile(settingsPath, 'utf8'));
      settings['copilotPace.mockScenario'] = scenario;
      await writeFile(settingsPath, JSON.stringify(settings, null, 2));
      await waitFor(() => vscode.workspace.getConfiguration('copilotPace').get('mockScenario') === scenario);
      await vscode.commands.executeCommand('copilotPace.refresh');
      assert.equal(api.getModel().demo, false);
      assert.equal(api.getState().phase, 'disconnected');
      assert.equal(api.getState().snapshot, undefined);
    }
  });
  it('renders the production hover and initializes the panel without demo controls', async () => {
    const tooltip = api.getTooltip();
    assert.ok(tooltip);
    assert.deepEqual(tooltip.isTrusted, { enabledCommands: ['copilotPace.showDetails', 'copilotPace.refresh', 'copilotPace.connect'] });
    assert.ok(!tooltip.value.includes('Demo'));
    assert.ok(!tooltip.value.includes('copilotPace.demo'));
    await vscode.commands.executeCommand('copilotPace.showDetails');
    await waitFor(() => api.isPanelReady());
    const panel = api.getPanel();
    assert.ok(panel);
    assert.ok(panel.webview.html.includes('Daily pace'));
    assert.ok(!panel.webview.html.includes('Simulated data'));
    assert.ok(!panel.webview.html.includes('id="demo"'));
    await api.receiveMessage({ action: 'dayMode', value: 'weekdays' });
    await waitFor(() => api.getModel().dayMode === 'weekdays');
    assert.equal(api.getModel().demo, false);
  });
  it('switches the production language through the panel and saves the preference', async () => {
    const panel = api.getPanel();
    assert.ok(panel);
    assert.equal(api.getModel().language, 'en');
    assert.equal(api.getModel().text.switchLanguage, 'Spanish');
    try {
      await api.receiveMessage({ action: 'language', value: 'es-ES' });
      await waitFor(() => api.getModel().language === 'es-ES');
      assert.equal(vscode.workspace.getConfiguration('copilotPace').inspect('language')?.globalValue, 'es-ES');
      assert.equal(api.getStatus().text, 'Conectar con GitHub');
      assert.equal(api.getModel().text.switchLanguage, 'Inglés');
      assert.equal(api.getPanel(), panel);
      assert.equal(api.getModel().demo, false);
      assert.ok(!api.getTooltip()?.value.includes('[Inglés]'));
      await api.receiveMessage({ action: 'language', value: 'en' });
      await waitFor(() => api.getModel().language === 'en');
      assert.equal(api.getStatus().text, 'Connect GitHub');
    } finally { await api.receiveMessage({ action: 'language', value: 'en' }); }
  });
  it('keeps the Enterprise configuration error separate from normal GitHub.com login', async () => {
    const config = vscode.workspace.getConfiguration('copilotPace');
    try {
      await config.update('authProvider', 'github-enterprise', vscode.ConfigurationTarget.Global);
      await waitFor(() => api.getState().failure?.code === 'configuration');
      assert.equal(api.getModel().demo, false);
      assert.equal(api.getState().snapshot, undefined);
      assert.ok(api.getModel().message.includes('HTTPS'));
      await config.update('authProvider', 'github', vscode.ConfigurationTarget.Global);
      await waitFor(() => api.getState().phase === 'disconnected');
      assert.equal(api.getStatus().text, 'Connect GitHub');
      assert.equal(api.getModel().accountLabel, '');
    } finally {
      await config.update('authProvider', undefined, vscode.ConfigurationTarget.Global);
    }
  });
});
