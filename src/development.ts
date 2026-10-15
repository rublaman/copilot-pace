import type * as vscode from 'vscode';
import type { Clock } from './domain';
import { isScenario, resolveScenario, MockSessions, MockTransport, scenarioLabels } from './mocks';

// Only referenced behind __DEV__ guards, so this module and mocks are removed from production.
export function registerDemoCommands(host: typeof vscode, updateConfig: (key: string, value: string) => Promise<void>): vscode.Disposable[] {
  return [
    host.commands.registerCommand('copilotPace.demo', async () => {
      const selection = await host.window.showQuickPick(Object.entries(scenarioLabels).map(([scenario, label]) => ({ label, scenario })), { title: 'Copilot Pace · Demo scenarios' });
      if (!selection) return;
      await updateConfig('mockScenario', selection.scenario);
      await updateConfig('dataSource', 'mock');
    }),
    host.commands.registerCommand('copilotPace.useGitHub', () => updateConfig('dataSource', 'github')),
  ];
}

export function getDemoSource(host: typeof vscode, config: vscode.WorkspaceConfiguration, clock: Clock) {
  if (config.get<string>('dataSource') !== 'mock') return;
  const configured = config.get<string>('mockScenario', '10000-comfortable');
  const scenario = resolveScenario(configured);
  if (!isScenario(configured)) {
    void config.update('mockScenario', scenario, host.ConfigurationTarget.Global).then(undefined, () => { /* The in-memory alias still works if settings are read-only. */ });
  }
  return {
    key: `mock:${scenario}`, label: scenarioLabels[scenario],
    sessions: new MockSessions(scenario), transport: new MockTransport(scenario, clock),
  };
}
