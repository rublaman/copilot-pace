import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import type * as vscode from 'vscode';
import type { activate } from '../../src/extension';

const loadNodeModule = createRequire(__filename);

describe('Development build activation boundary', () => {
  for (const [name, mode, demos] of [['Production', 1, false], ['Development', 2, true], ['Test', 3, true]] as const) {
    it(`${name}: ${demos ? 'enables' : 'rejects'} demos even with saved mock settings`, async () => {
      const commands = new Set<string>();
      const status = { text: '', show() {}, dispose() {} };
      let realSessionRequests = 0;
      const disposable = { dispose() {} };
      const settings: Record<string, unknown> = { dataSource: 'mock', mockScenario: '10000-comfortable', dayMode: 'all' };
      const host = {
        ExtensionMode: { Production: 1, Development: 2, Test: 3 },
        StatusBarAlignment: { Right: 2 },
        ThemeColor: class { constructor(public id: string) {} },
        MarkdownString: class { constructor(public value: string) {} },
        commands: {
          registerCommand: (id: string) => { commands.add(id); return disposable; },
          executeCommand: async () => {},
        },
        window: { createStatusBarItem: () => status },
        workspace: {
          getConfiguration: () => ({ get: (key: string, fallback?: unknown) => settings[key] ?? fallback }),
          onDidChangeConfiguration: () => disposable,
        },
        authentication: {
          getSession: async () => { realSessionRequests++; return undefined; },
          onDidChangeSessions: () => disposable,
        },
      };
      const context = { extensionMode: mode, subscriptions: [] as vscode.Disposable[] };
      const module = { exports: {} as { activate: typeof activate } };
      runInNewContext(readFileSync('out/development/dist/extension.js', 'utf8'), {
        module, exports: module.exports,
        require: (id: string) => id === 'vscode' ? host : loadNodeModule(id),
        Date, Intl, AbortController, setTimeout, clearTimeout,
      });
      try {
        const api = module.exports.activate(context as unknown as vscode.ExtensionContext);
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(commands.has('copilotPace.demo'), demos);
        assert.equal(commands.has('copilotPace.useGitHub'), demos);
        assert.equal(status.text.endsWith(' · Demo'), demos);
        assert.equal(realSessionRequests, demos ? 0 : 1);
        assert.equal(api !== undefined, name === 'Test');
        if (!demos) assert.equal(status.text, 'Connect GitHub');
      } finally {
        for (const subscription of context.subscriptions) subscription.dispose();
      }
    });
  }
});
