import type * as vscode from 'vscode';
import type { Clock } from './domain';
import type { Language } from './i18n';
import { isScenario, resolveScenario, MockSessions, MockTransport, scenarioLabels } from './mocks';

// Only referenced behind __DEV__ guards, so this module and mocks are removed from production.
export function registerDemoCommands(host: typeof vscode, updateConfig: (key: string, value: string) => Promise<void>, getLanguage: () => Language = () => 'en'): vscode.Disposable[] {
  return [
    host.commands.registerCommand('copilotPace.demo', async () => {
      const language = getLanguage();
      const selection = await host.window.showQuickPick(Object.entries(scenarioLabels).map(([scenario, label]) => ({ label: localizeDemoScenario(label, language), scenario })), { title: language === 'es-ES' ? 'Copilot Pace · Escenarios de demostración' : 'Copilot Pace · Demo scenarios' });
      if (!selection) return;
      await updateConfig('mockScenario', selection.scenario);
      await updateConfig('dataSource', 'mock');
    }),
    host.commands.registerCommand('copilotPace.useGitHub', () => updateConfig('dataSource', 'github')),
  ];
}

export function localizeDemoScenario(label: string, language: Language): string {
  if (language === 'en') return label;
  const translations: Record<string, string> = {
    '10,000 credits · 40% used': '10.000 créditos · 40% consumido',
    '10,000 credits · 1 used (<0.1%)': '10.000 créditos · 1 consumido (<0,1%)',
    '10,000 credits · 2 used (<0.1%)': '10.000 créditos · 2 consumidos (<0,1%)',
    '3,900 credits · 45% used': '3900 créditos · 45% consumido',
    '3,900 credits · 60% used': '3900 créditos · 60% consumido',
    'Before: 1,950 used / 3,900': 'Antes: 1950 consumidos / 3900',
    'After: 1,950 used / 10,000': 'Después: 1950 consumidos / 10.000',
    'Budget exhausted': 'Presupuesto agotado',
    'Usage without a known budget': 'Consumo sin presupuesto conocido',
    'Incomplete response': 'Respuesta incompleta',
    'Not signed in': 'Sin sesión iniciada',
    'Request timed out': 'Tiempo de espera agotado',
    'HTTP 401 · Session unauthorized': 'HTTP 401 · Sesión no autorizada',
    'HTTP 403 · Access denied': 'HTTP 403 · Acceso denegado',
    'HTTP 429 · Rate limited': 'HTTP 429 · Solicitudes limitadas',
    'HTTP 500 · Server error': 'HTTP 500 · Error del servidor',
  };
  return translations[label] ?? label;
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
