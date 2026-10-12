import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { systemClock, type DayMode } from './domain';
import { isScenario, resolveScenario, MockSessions, MockTransport, scenarioLabels, type MockScenario } from './mocks';
import { createViewModel, renderHtml, renderHover, hoverCommands, type ViewModel } from './presentation';
import { QuotaService, type ServiceState } from './service';
import { GitHubTransport, type SessionProvider } from './transport';

class GitHubSessions implements SessionProvider {
  async get(interactive: boolean) {
    const session = await vscode.authentication.getSession('github', ['read:user'], interactive
      ? { createIfNone: true, clearSessionPreference: true } : { silent: true });
    return session ? { id: session.id, accessToken: session.accessToken } : undefined;
  }
}
export interface TestApi {
  getState(): ServiceState;
  getModel(): ViewModel;
  getStatus(): { text: string; color: string | vscode.ThemeColor | undefined; alignment: vscode.StatusBarAlignment; priority: number | undefined };
  getPanel(): vscode.WebviewPanel | undefined;
  getTooltip(): vscode.MarkdownString | undefined;
  isPanelReady(): boolean;
  receiveMessage(message: unknown): Promise<void>;
  dispose(): void;
}

class CopilotPace implements vscode.Disposable {
  private readonly subscriptions: vscode.Disposable[] = [];
  private readonly status = vscode.window.createStatusBarItem('copilotPace.status', vscode.StatusBarAlignment.Right, 100.05);
  private service!: QuotaService;
  private readonly clock = systemClock;
  private demo = false;
  private scenario: MockScenario = '10000-comfortable';
  private dayMode: DayMode = 'all';
  private sourceKey = '';
  private panel?: vscode.WebviewPanel;
  private panelReady = false;
  private timer?: ReturnType<typeof setTimeout>;
  private disposed = false;
  constructor() {
    this.status.name = 'Copilot Pace';
    this.status.command = 'copilotPace.showDetails';
    this.subscriptions.push(this.status,
      vscode.commands.registerCommand('copilotPace.showDetails', () => this.showDetails()),
      vscode.commands.registerCommand('copilotPace.refresh', () => this.refresh()),
      vscode.commands.registerCommand('copilotPace.connect', () => this.refresh(!this.demo)),
      vscode.commands.registerCommand('copilotPace.demo', () => this.chooseDemo()),
      vscode.commands.registerCommand('copilotPace.useGitHub', () => this.updateConfig('dataSource', 'github')),
      vscode.workspace.onDidChangeConfiguration(event => { if (event.affectsConfiguration('copilotPace')) this.configure(); }),
      vscode.authentication.onDidChangeSessions(event => {
        if (event.provider.id === 'github' && !this.demo) { this.service.reset(); void this.refresh(); }
      }),
    );
    this.configure();
    this.status.show();
  }
  private configure() {
    const config = vscode.workspace.getConfiguration('copilotPace');
    this.dayMode = config.get<string>('dayMode') === 'weekdays' ? 'weekdays' : 'all';
    const demo = config.get<string>('dataSource') === 'mock';
    const configured = config.get<string>('mockScenario', '10000-comfortable');
    const scenario = resolveScenario(configured);
    if (!isScenario(configured)) {
      void config.update('mockScenario', scenario, vscode.ConfigurationTarget.Global).then(undefined, () => { /* The in-memory alias still works if settings are read-only. */ });
    }
    const key = demo ? `mock:${scenario}` : 'github';
    if (key !== this.sourceKey) {
      this.service?.dispose();
      this.sourceKey = key; this.demo = demo; this.scenario = scenario;
      this.service = new QuotaService({
        sessions: demo ? new MockSessions(scenario) : new GitHubSessions(),
        transport: demo ? new MockTransport(scenario, this.clock) : new GitHubTransport(vscode.version),
        dataClock: this.clock,
      }, () => this.render());
      void this.refresh();
    } else { this.render(); this.schedule(); }
  }
  private async updateConfig(key: string, value: string) {
    await vscode.workspace.getConfiguration('copilotPace').update(key, value, vscode.ConfigurationTarget.Global);
    // Also apply synchronously for command callers; a subsequent config event is idempotent.
    if (!this.disposed) this.configure();
  }
  private async chooseDemo() {
    const selection = await vscode.window.showQuickPick(Object.entries(scenarioLabels).map(([scenario, label]) => ({ label, scenario })), { title: 'Copilot Pace · Demo scenarios' });
    if (!selection) return;
    await this.updateConfig('mockScenario', selection.scenario);
    await this.updateConfig('dataSource', 'mock');
  }
  async refresh(interactive = false) {
    const service = this.service;
    await service.refresh(interactive);
    if (!this.disposed && this.service === service) this.schedule();
  }
  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    if (this.disposed) return;
    const configured = vscode.workspace.getConfiguration('copilotPace').get<number>('pollIntervalMinutes', 15);
    const minutes = Number.isFinite(configured) ? Math.min(120, Math.max(5, configured)) : 15;
    const delay = this.service.nextAllowedAt > Date.now() ? this.service.nextAllowedAt - Date.now() : minutes * 60_000;
    this.timer = setTimeout(() => { void this.refresh(); }, Math.min(delay, 2_147_483_647));
    this.timer.unref();
  }
  get model(): ViewModel { return createViewModel(this.service.current, this.clock, this.dayMode, this.demo, scenarioLabels[this.scenario], this.service.nextAllowedAt); }
  private render() {
    if (this.disposed) return;
    const model = this.model;
    this.status.text = model.statusText;
    const color = { good: 'charts.green', watch: 'charts.yellow', over: 'charts.red', neutral: undefined }[model.tone];
    this.status.color = color ? new vscode.ThemeColor(color) : undefined;
    const tooltip = new vscode.MarkdownString(renderHover(model), true);
    tooltip.isTrusted = { enabledCommands: hoverCommands };
    tooltip.supportHtml = false;
    this.status.tooltip = tooltip;
    this.status.accessibilityInformation = { label: `Copilot Pace: ${model.statusText}` };
    if (this.panel) void this.panel.webview.postMessage({ type: 'state', model });
  }
  private showDetails() {
    if (this.panel) { this.panel.reveal(); this.render(); return; }
    const panel = vscode.window.createWebviewPanel('copilotPace.details', 'Copilot Pace', vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [] });
    this.panel = panel;
    this.panelReady = false;
    panel.webview.html = renderHtml(this.model, randomBytes(18).toString('hex'));
    const receiver = panel.webview.onDidReceiveMessage((message: unknown) => { void this.receiveMessage(message); });
    panel.onDidDispose(() => { receiver.dispose(); if (this.panel === panel) { this.panel = undefined; this.panelReady = false; } });
  }
  async receiveMessage(message: unknown) {
    if (this.disposed || !message || typeof message !== 'object') return;
    const data = message as { action?: unknown; value?: unknown };
    if (data.action === 'ready') { this.panelReady = true; this.render(); }
    else if (data.action === 'refresh') await this.refresh();
    else if (data.action === 'connect') await this.refresh(!this.demo);
    else if (data.action === 'dayMode' && (data.value === 'all' || data.value === 'weekdays')) await this.updateConfig('dayMode', data.value);
  }
  get testApi(): TestApi {
    return {
      getState: () => this.service.current, getModel: () => this.model,
      getTooltip: () => this.status.tooltip instanceof vscode.MarkdownString ? this.status.tooltip : undefined,
      getStatus: () => ({ text: this.status.text, color: this.status.color, alignment: this.status.alignment, priority: this.status.priority }),
      getPanel: () => this.panel, isPanelReady: () => this.panelReady, receiveMessage: message => this.receiveMessage(message), dispose: () => this.dispose(),
    };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    this.service.dispose(); this.panel?.dispose();
    for (const subscription of this.subscriptions) subscription.dispose();
  }
}

export function activate(context: vscode.ExtensionContext): TestApi | undefined {
  const app = new CopilotPace();
  context.subscriptions.push(app);
  return context.extensionMode === vscode.ExtensionMode.Test ? app.testApi : undefined;
}
