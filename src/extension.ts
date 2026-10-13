import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { systemClock, type DayMode } from './domain';
import { getDemoSource, registerDemoCommands } from './development';
import { createViewModel, renderHtml, renderHover, hoverCommands, type ViewModel } from './presentation';
import { QuotaService, type ServiceState } from './service';
import { GitHubSessions } from './sessions';
import { GitHubTransport } from './transport';

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
  private readonly imageDirectory: vscode.Uri;
  private service!: QuotaService;
  private readonly clock = systemClock;
  private demo = false;
  private scenario = '';
  private readonly developmentEnabled: boolean;
  private dayMode: DayMode = 'all';
  private sourceKey = '';
  private panel?: vscode.WebviewPanel;
  private panelReady = false;
  private timer?: ReturnType<typeof setTimeout>;
  private disposed = false;
  constructor(context: vscode.ExtensionContext) {
    this.imageDirectory = vscode.Uri.joinPath(context.extensionUri, 'images');
    this.developmentEnabled = __DEV__ && (context.extensionMode === vscode.ExtensionMode.Development || context.extensionMode === vscode.ExtensionMode.Test);
    this.status.name = 'Copilot Pace';
    this.status.command = 'copilotPace.showDetails';
    this.subscriptions.push(this.status,
      vscode.commands.registerCommand('copilotPace.showDetails', () => this.showDetails()),
      vscode.commands.registerCommand('copilotPace.refresh', () => this.refresh()),
      vscode.commands.registerCommand('copilotPace.connect', () => this.refresh(!this.demo)),
      vscode.workspace.onDidChangeConfiguration(event => { if (event.affectsConfiguration('copilotPace')) this.configure(); }),
      vscode.authentication.onDidChangeSessions(event => {
        if (event.provider.id === 'github' && !this.demo) { this.service.reset(); void this.refresh(); }
      }),
    );
    if (__DEV__ && this.developmentEnabled) {
      void vscode.commands.executeCommand('setContext', 'copilotPace.development', true);
      this.subscriptions.push(...registerDemoCommands(vscode, (key, value) => this.updateConfig(key, value)));
    }
    this.configure();
    this.status.show();
  }
  private configure() {
    const config = vscode.workspace.getConfiguration('copilotPace');
    this.dayMode = config.get<string>('dayMode') === 'weekdays' ? 'weekdays' : 'all';
    const source = __DEV__ && this.developmentEnabled ? getDemoSource(vscode, config, this.clock) : undefined;
    const key = source?.key ?? 'github';
    if (key !== this.sourceKey) {
      this.service?.dispose();
      this.sourceKey = key; this.demo = source !== undefined; this.scenario = source?.label ?? '';
      this.service = new QuotaService({
        sessions: source?.sessions ?? new GitHubSessions(vscode.authentication),
        transport: source?.transport ?? new GitHubTransport(vscode.version),
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
    const now = this.clock.now().getTime();
    const delay = this.service.nextAllowedAt > now ? this.service.nextAllowedAt - now : minutes * 60_000;
    this.timer = setTimeout(() => { void this.refresh(); }, Math.min(delay, 2_147_483_647));
    this.timer.unref();
  }
  get model(): ViewModel { return createViewModel(this.service.current, this.clock, this.dayMode, this.demo, this.scenario, this.service.nextAllowedAt); }
  private render() {
    if (this.disposed) return;
    const model = this.model;
    this.status.text = model.statusText;
    const color = { good: 'charts.green', watch: 'charts.yellow', over: 'charts.red', neutral: undefined }[model.tone];
    this.status.color = color ? new vscode.ThemeColor(color) : undefined;
    const tooltip = new vscode.MarkdownString(renderHover(model), true);
    tooltip.isTrusted = { enabledCommands: __DEV__ && this.developmentEnabled ? [...hoverCommands, 'copilotPace.demo'] : hoverCommands };
    tooltip.supportHtml = false;
    this.status.tooltip = tooltip;
    this.status.accessibilityInformation = { label: `Copilot Pace: ${model.statusText}` };
    if (this.panel) void this.panel.webview.postMessage({ type: 'state', model });
  }
  private showDetails() {
    if (this.panel) { this.panel.reveal(); this.render(); return; }
    const iconPath = vscode.Uri.joinPath(this.imageDirectory, 'copilot-pace-ui.svg');
    const darkIconPath = vscode.Uri.joinPath(this.imageDirectory, 'copilot-pace-ui-dark.svg');
    const panel = vscode.window.createWebviewPanel('copilotPace.details', 'Copilot Pace', vscode.ViewColumn.Beside, {
      enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [this.imageDirectory],
    });
    panel.iconPath = { light: iconPath, dark: darkIconPath };
    this.panel = panel;
    this.panelReady = false;
    const webviewIcon = panel.webview.asWebviewUri(iconPath).toString();
    panel.webview.html = renderHtml(this.model, randomBytes(18).toString('hex'), webviewIcon, panel.webview.cspSource);
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
  const app = new CopilotPace(context);
  context.subscriptions.push(app);
  return context.extensionMode === vscode.ExtensionMode.Test ? app.testApi : undefined;
}
