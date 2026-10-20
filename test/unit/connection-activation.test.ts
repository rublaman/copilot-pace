import * as assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import type * as vscode from 'vscode';
import type { activate, TestApi } from '../../src/extension';
import { boundedFixture } from '../../src/mocks';

const loadNodeModule = createRequire(__filename);
const settle = () => new Promise<void>(resolve => setImmediate(resolve));
const session = (provider: string): vscode.AuthenticationSession => ({
  id: `${provider}-session`, accessToken: `${provider}-synthetic`,
  account: { id: 'same-account-id', label: provider }, scopes: ['read:user'],
});

function harness(initial: Record<string, unknown> = {}, options: {
  trusted?: boolean;
  authenticate?: (provider: string, options: vscode.AuthenticationGetSessionOptions) => Promise<vscode.AuthenticationSession | undefined>;
  pendingNetwork?: boolean;
  pluralSupported?: boolean;
} = {}) {
  const settings = { ...initial };
  const configurationListeners: Array<(event: vscode.ConfigurationChangeEvent) => void> = [];
  const sessionListeners: Array<(event: { provider: { id: string } }) => void> = [];
  const commands = new Map<string, () => Promise<void>>();
  const requests: Array<{ url: string; token: string; signal: AbortSignal }> = [];
  const responses: Array<() => void> = [];
  const authCalls: Array<{ provider: string; options: vscode.AuthenticationGetSessionOptions; scopes: readonly string[] }> = [];
  const pickedChoices: string[][] = [];
  let choice: string | undefined;
  const disposable = { dispose() {} };
  const fireConfiguration = (key: string) => configurationListeners.forEach(listener => listener({
    affectsConfiguration: section => key === section || key.startsWith(`${section}.`),
  }));
  const host = {
    version: '1.141.0',
    Uri: { joinPath: (base: URL, ...parts: string[]) => new URL(parts.join('/'), base) },
    ExtensionMode: { Production: 1, Development: 2, Test: 3 }, StatusBarAlignment: { Right: 2 },
    ThemeColor: class { constructor(public id: string) {} },
    MarkdownString: class { constructor(public value: string) {} },
    commands: {
      registerCommand: (id: string, callback: () => Promise<void>) => { commands.set(id, callback); return disposable; },
      executeCommand: async () => {},
    },
    window: {
      createStatusBarItem: () => ({ text: '', show() {}, dispose() {} }),
      showQuickPick: async (items: Array<{ provider: string }>) => {
        pickedChoices.push(Array.from(items, item => item.provider));
        return items.find(item => item.provider === choice);
      },
    },
    workspace: {
      isTrusted: options.trusted ?? true,
      getConfiguration: (section: string) => ({
        get: (key: string, fallback?: unknown) => settings[`workspace:${section}.${key}`] ?? settings[`${section}.${key}`] ?? fallback,
        inspect: (key: string) => {
          const value = settings[`${section}.${key}`];
          return { key, globalValue: value, workspaceValue: settings[`workspace:${section}.${key}`] };
        },
        update: async (key: string, value: unknown) => { settings[`${section}.${key}`] = value; fireConfiguration(`${section}.${key}`); },
      }),
      onDidChangeConfiguration: (listener: (event: vscode.ConfigurationChangeEvent) => void) => { configurationListeners.push(listener); return disposable; },
      onDidGrantWorkspaceTrust: () => disposable,
    },
    authentication: {
      getSession: async (provider: string, scopes: string[], authOptions: vscode.AuthenticationGetSessionOptions) => {
        authCalls.push({ provider, scopes, options: authOptions });
        return options.authenticate ? options.authenticate(provider, authOptions) : session(provider);
      },
      onDidChangeSessions: (listener: (event: { provider: { id: string } }) => void) => { sessionListeners.push(listener); return disposable; },
    },
    ConfigurationTarget: { Global: 1 },
    extensions: { getExtension: () => ({ packageJSON: { contributes: { configuration: [{ properties:
      options.pluralSupported === false ? { 'github-enterprise.uri': {} } : { 'github-enterprise.uris': {} },
    }] } } }) },
  };
  const http = {
    request: (url: string, requestOptions: { headers: { Authorization: string }; signal: AbortSignal }, callback: (response: EventEmitter) => void) => {
      requests.push({ url, token: requestOptions.headers.Authorization, signal: requestOptions.signal });
      const request = new EventEmitter() as EventEmitter & { end(): void; destroy(error: Error): void };
      request.destroy = error => { request.emit('error', error); request.emit('close'); };
      requestOptions.signal.addEventListener('abort', () => request.destroy(new Error('Aborted')), { once: true });
      const respond = () => {
        const response = Object.assign(new EventEmitter(), { statusCode: 200, headers: {} });
        callback(response);
        response.emit('data', Buffer.from(JSON.stringify(boundedFixture(100, 25, new Date()))));
        response.emit('end'); request.emit('close');
      };
      responses.push(respond);
      request.end = () => queueMicrotask(() => { if (!options.pendingNetwork) respond(); });
      return request;
    },
  };
  const context = { extensionMode: 3, extensionUri: new URL('file:///extension/'), subscriptions: [] as vscode.Disposable[] };
  const module = { exports: {} as { activate: typeof activate } };
  runInNewContext(readFileSync('out/development/dist/extension.js', 'utf8'), {
    module, exports: module.exports,
    require: (id: string) => id === 'vscode' ? host : id === 'node:https' ? http : loadNodeModule(id),
    Date, Intl, URL, Buffer, AbortController, setTimeout, clearTimeout,
  });
  const api = module.exports.activate(context as unknown as vscode.ExtensionContext) as TestApi;
  return {
    api, authCalls, requests, settings, pickedChoices,
    choose: (provider: string | undefined) => { choice = provider; },
    connect: () => commands.get('copilotPace.connect')!(),
    completeRequest: (index: number) => responses[index]!(),
    set: (key: string, value: unknown) => { settings[key] = value; fireConfiguration(key); },
    sessionChanged: (provider: string) => sessionListeners.forEach(listener => listener({ provider: { id: provider } })),
    dispose: () => api.dispose(),
  };
}

describe('Connection integration with native VS Code services', () => {
  for (const plan of ['personal', 'Business']) {
    it(`preserves normal ${plan} login and quota requests without an extra picker`, async () => {
      const host = harness({}, { authenticate: async () => session(plan) });
      try {
        await settle(); await host.connect();
        assert.deepEqual(host.authCalls.map(call => call.provider), ['github', 'github']);
        assert.deepEqual(host.authCalls.map(call => [...call.scopes]), [['read:user'], ['read:user']]);
        assert.equal(host.authCalls[0]?.options.silent, true);
        assert.ok(host.authCalls[1]?.options.createIfNone);
        assert.equal(host.pickedChoices.length, 0);
        assert.ok(host.requests.every(request => request.url === 'https://api.github.com/copilot_internal/user'));
        assert.equal(host.api.getState().phase, 'ready');
      } finally { host.dispose(); }
    });
  }
  it('uses the configured Enterprise provider and matching quota host automatically', async () => {
    const host = harness({ 'github.copilot.advanced': { authProvider: 'github-enterprise' }, 'github-enterprise.uri': 'https://corp.ghe.com' });
    try {
      await settle();
      assert.equal(host.authCalls[0]?.provider, 'github-enterprise');
      assert.equal(host.requests[0]?.url, 'https://api.corp.ghe.com/copilot_internal/user');
      assert.equal(host.requests[0]?.token, 'Bearer github-enterprise-synthetic');
      assert.equal(host.api.getState().phase, 'ready');
      assert.ok(host.api.getModel().accountLabel.includes('corp.ghe.com'));
      assert.equal(host.pickedChoices.length, 0);
    } finally { host.dispose(); }
  });
  it('keeps normal GitHub.com when Enterprise is configured for another extension', async () => {
    const host = harness({ 'github-enterprise.uri': 'https://corp.ghe.com' });
    try { await settle(); assert.equal(host.authCalls[0]?.provider, 'github'); }
    finally { host.dispose(); }
  });
  it('offers both providers and switches back to GitHub.com without changing Copilot settings', async () => {
    const advanced = { authProvider: 'github-enterprise' };
    const host = harness({ 'github.copilot.advanced': advanced, 'github-enterprise.uri': 'https://corp.ghe.com' });
    try {
      await settle(); host.choose('github'); await host.connect();
      assert.deepEqual(host.pickedChoices[0], ['github-enterprise', 'github']);
      assert.equal(host.settings['copilotPace.authProvider'], 'github');
      assert.equal(host.settings['github.copilot.advanced'], advanced);
      assert.equal(host.requests.at(-1)?.url, 'https://api.github.com/copilot_internal/user');
      assert.equal(host.requests.at(-1)?.token, 'Bearer github-synthetic');
      assert.equal(host.api.getModel().accountLabel, 'github');
      host.choose('github-enterprise'); await host.connect();
      assert.equal(host.requests.at(-1)?.url, 'https://api.corp.ghe.com/copilot_internal/user');
    } finally { host.dispose(); }
  });
  it('cancels provider selection without changing account, quota or configuration', async () => {
    const host = harness({ 'github-enterprise.uri': 'https://corp.ghe.com' });
    try {
      await settle(); const before = host.api.getState(); const calls = host.authCalls.length;
      await host.connect();
      assert.equal(host.api.getState(), before);
      assert.equal(host.authCalls.length, calls);
      assert.equal(host.settings['copilotPace.authProvider'], undefined);
    } finally { host.dispose(); }
  });
  it('cancels native corporate login without attempting GitHub.com', async () => {
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://corp.ghe.com' }, {
      authenticate: async (_provider, options) => { if (!options.silent) throw new Error('Cancelled'); return undefined; },
    });
    try {
      await settle(); host.choose('github-enterprise'); await host.connect();
      assert.ok(host.authCalls.every(call => call.provider === 'github-enterprise'));
      assert.equal(host.requests.length, 0);
      assert.equal(host.api.getState().failure?.code, 'auth');
    } finally { host.dispose(); }
  });
  it('does not send any credential when several Enterprise instances could own the session', async () => {
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uris': ['https://one.ghe.com', 'https://two.ghe.com'] });
    try {
      await settle(); assert.equal(host.authCalls.length, 0);
      assert.equal(host.requests.length, 0);
      assert.equal(host.api.getState().failure?.code, 'configuration');
      assert.equal(host.api.getState().snapshot, undefined);
    } finally { host.dispose(); }
  });
  it('ignores untrusted workspace instance settings and uses only the user instance', async () => {
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://user.ghe.com',
      'workspace:github-enterprise.uris': ['https://untrusted.example.com'] }, { trusted: false });
    try { await settle(); assert.equal(host.requests[0]?.url, 'https://api.user.ghe.com/copilot_internal/user'); }
    finally { host.dispose(); }
  });
  it('uses the effective workspace instance when the workspace is trusted', async () => {
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://user.ghe.com',
      'workspace:github-enterprise.uris': ['https://trusted.ghe.com'] });
    try { await settle(); assert.equal(host.requests[0]?.url, 'https://api.trusted.ghe.com/copilot_internal/user'); }
    finally { host.dispose(); }
  });
  it('deduplicates repeated connect actions', async () => {
    const host = harness({ 'github-enterprise.uri': 'https://corp.ghe.com' });
    try {
      await settle(); host.choose('github-enterprise');
      const first = host.connect(); const second = host.connect();
      assert.equal(first, second); await first;
      assert.equal(host.pickedChoices.length, 1);
      assert.equal(host.authCalls.filter(call => call.options.createIfNone).length, 1);
    } finally { host.dispose(); }
  });
  for (const provider of ['github', 'github-enterprise']) {
    it(`finishes ${provider} sign-in when its session event arrives before native login returns`, async () => {
      let connected = false;
      const host = harness({ 'copilotPace.authProvider': provider, 'github-enterprise.uri': 'https://corp.ghe.com' }, {
        authenticate: async (selected, options) => {
          if (options.silent) return connected ? session(selected) : undefined;
          // VS Code can notify listeners before getSession has finished granting access
          // and saving this extension's selected account preference.
          host.sessionChanged(selected);
          await settle();
          connected = true;
          return session(selected);
        },
      });
      try {
        await settle(); host.choose(provider); await host.connect();
        assert.equal(host.api.getState().phase, 'ready');
        assert.equal(host.requests.length, 1);
        assert.equal(host.requests[0]?.token, `Bearer ${provider}-synthetic`);
        assert.ok(host.authCalls.every(call => call.provider === provider));
        assert.equal(host.authCalls.filter(call => call.options.createIfNone).length, 1);
        assert.equal(host.authCalls.at(-1)?.options.silent, true);
      } finally { host.dispose(); }
    });
    it(`does not resurrect a ${provider} login that finishes after logout`, async () => {
      let complete!: (value: vscode.AuthenticationSession) => void;
      const host = harness({ 'copilotPace.authProvider': provider, 'github-enterprise.uri': 'https://corp.ghe.com' }, {
        authenticate: async (_selected, options) => options.silent ? undefined : new Promise(resolve => { complete = resolve; }),
      });
      try {
        await settle(); host.choose(provider);
        const login = host.connect(); await settle();
        host.sessionChanged(provider); await settle();
        complete(session(provider)); await login;
        assert.equal(host.api.getState().phase, 'disconnected');
        assert.equal(host.api.getState().account, undefined);
        assert.equal(host.api.getState().snapshot, undefined);
        assert.equal(host.requests.length, 0);
        assert.equal(host.authCalls.filter(call => call.options.createIfNone).length, 1);
        assert.equal(host.authCalls.at(-1)?.options.silent, true);
      } finally { host.dispose(); }
    });
    it(`clears ${provider} logout immediately, aborts pending usage and rejects a late response`, async () => {
      let connected = true;
      const host = harness({ 'copilotPace.authProvider': provider, 'github-enterprise.uri': 'https://corp.ghe.com' }, {
        pendingNetwork: true,
        authenticate: async selected => connected ? session(selected) : undefined,
      });
      try {
        await settle(); host.completeRequest(0); await settle();
        assert.equal(host.api.getState().phase, 'ready');
        const refresh = host.api.receiveMessage({ action: 'refresh' }); await settle();
        connected = false; host.sessionChanged(provider);
        assert.equal(host.api.getState().snapshot, undefined);
        assert.equal(host.api.getState().account, undefined);
        assert.equal(host.api.getState().updatedAt, undefined);
        assert.equal(host.api.getModel().accountLabel, '');
        assert.equal(host.api.getModel().used, '—');
        assert.equal(host.requests[1]?.signal.aborted, true);
        await refresh; await settle();
        host.completeRequest(1); await settle();
        assert.equal(host.api.getState().phase, 'disconnected');
        assert.equal(host.api.getState().snapshot, undefined);
        assert.equal(host.requests.length, 2);
        assert.ok(host.authCalls.every(call => call.provider === provider && call.options.silent));
      } finally { host.dispose(); }
    });
    it(`isolates a pending ${provider} request when switching to the other provider`, async () => {
      const next = provider === 'github' ? 'github-enterprise' : 'github';
      const host = harness({ 'copilotPace.authProvider': provider, 'github-enterprise.uri': 'https://corp.ghe.com' }, { pendingNetwork: true });
      try {
        await settle(); host.set('copilotPace.authProvider', next); await settle();
        assert.equal(host.requests[0]?.signal.aborted, true);
        assert.equal(host.api.getState().snapshot, undefined);
        host.completeRequest(1); await settle();
        assert.equal(host.api.getState().phase, 'ready');
        const current = host.api.getState();
        host.completeRequest(0); host.sessionChanged(provider); await settle();
        assert.equal(host.api.getState(), current);
        assert.equal(host.requests.length, 2);
        for (const request of host.requests) {
          const enterprise = request.token === 'Bearer github-enterprise-synthetic';
          assert.equal(request.url, enterprise ? 'https://api.corp.ghe.com/copilot_internal/user' : 'https://api.github.com/copilot_internal/user');
        }
        assert.ok(!JSON.stringify([current, host.api.getModel(), host.api.getTooltip()]).includes('synthetic'));
      } finally { host.dispose(); }
    });
  }
  it('clears personal quota before silently reading a changed Business account', async () => {
    let selected = 'personal';
    const host = harness({}, {
      pendingNetwork: true,
      authenticate: async () => ({ ...session('github'), account: { id: selected, label: selected } }),
    });
    try {
      await settle(); host.completeRequest(0); await settle();
      assert.equal(host.api.getModel().accountLabel, 'personal');
      selected = 'Business'; host.sessionChanged('github');
      assert.equal(host.api.getState().snapshot, undefined);
      assert.equal(host.api.getState().account, undefined);
      await settle();
      assert.equal(host.api.getModel().accountLabel, 'Business');
      assert.equal(host.api.getState().snapshot, undefined);
      host.completeRequest(1); await settle();
      assert.equal(host.api.getState().phase, 'ready');
      assert.ok(host.authCalls.every(call => call.provider === 'github' && call.options.silent));
    } finally { host.dispose(); }
  });
  it('ignores plural settings when the running authentication extension only supports the legacy URI', async () => {
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://legacy.ghe.com',
      'github-enterprise.uris': ['https://unsupported.ghe.com'] }, { pluralSupported: false });
    try { await settle(); assert.equal(host.requests[0]?.url, 'https://api.legacy.ghe.com/copilot_internal/user'); }
    finally { host.dispose(); }
  });
  it('does not use the legacy URI when an explicitly empty supported plural list disables instances', async () => {
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://legacy.ghe.com', 'github-enterprise.uris': [] });
    try {
      await settle(); assert.equal(host.authCalls.length, 0); assert.equal(host.requests.length, 0);
      assert.equal(host.api.getState().failure?.code, 'configuration');
    } finally { host.dispose(); }
  });
  it('cancels the old request and requires reload when the enterprise host changes before its provider catches up', async () => {
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://old.ghe.com' }, { pendingNetwork: true });
    try {
      await settle(); const old = host.requests[0]!;
      host.set('github-enterprise.uri', 'https://new.ghe.com'); await settle();
      assert.equal(old.signal.aborted, true);
      assert.equal(host.requests.length, 1);
      assert.equal(host.authCalls.length, 1);
      assert.equal(host.api.getState().failure?.code, 'configurationChanged');
      assert.equal(host.api.getState().snapshot, undefined);
      assert.equal(host.api.getModel().accountLabel, '');
      host.set('copilotPace.authProvider', 'github'); await settle();
      assert.equal(host.requests.at(-1)?.url, 'https://api.github.com/copilot_internal/user');
    } finally { host.dispose(); }
  });
  it('ignores unrelated provider events and clears quota when the selected provider loses its session', async () => {
    let connected = true;
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://corp.ghe.com' }, {
      authenticate: async provider => connected ? session(provider) : undefined,
    });
    try {
      await settle(); const calls = host.authCalls.length;
      host.sessionChanged('github'); await settle(); assert.equal(host.authCalls.length, calls);
      connected = false; host.sessionChanged('github-enterprise'); await settle();
      assert.equal(host.api.getState().phase, 'disconnected');
      assert.equal(host.api.getState().snapshot, undefined);
      assert.equal(host.api.getModel().accountLabel, '');
    } finally { host.dispose(); }
  });
  it('invalidates a late enterprise session after switching the provider', async () => {
    let complete!: (value: vscode.AuthenticationSession) => void;
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://corp.ghe.com' }, {
      authenticate: async provider => provider === 'github-enterprise' ? new Promise(resolve => { complete = resolve; }) : session(provider),
    });
    try {
      await settle(); host.set('copilotPace.authProvider', 'github'); await settle();
      complete(session('github-enterprise')); await settle();
      assert.equal(host.requests.length, 1);
      assert.equal(host.requests[0]?.url, 'https://api.github.com/copilot_internal/user');
      assert.equal(host.api.getModel().accountLabel, 'github');
    } finally { host.dispose(); }
  });
});
