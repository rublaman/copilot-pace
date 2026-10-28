import * as assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import type * as vscode from 'vscode';
import type { activate, TestApi } from '../../src/extension';
import { boundedFixture } from '../../src/mocks';
import { HistoryStore, historyIdentity } from '../../src/history';

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
  storageDirectory?: string;
  apiResponse?: (url: string) => { status: number; body: unknown };
  openDocument?: (uri: { fsPath: string }) => Promise<{ fsPath: string }>;
  now?: () => number;
  beforeHistoryRead?: (file: string) => Promise<void>;
  beforeHistoryWrite?: (file: string) => Promise<void>;
} = {}) {
  const settings = { ...initial };
  const configurationListeners: Array<(event: vscode.ConfigurationChangeEvent) => void> = [];
  const sessionListeners: Array<(event: { provider: { id: string } }) => void> = [];
  const commands = new Map<string, () => Promise<void>>();
  const requests: Array<{ url: string; token: string; signal: AbortSignal }> = [];
  const allRequests: typeof requests = [];
  const responses: Array<() => void> = [];
  const authCalls: Array<{ provider: string; options: vscode.AuthenticationGetSessionOptions; scopes: readonly string[] }> = [];
  const pickedChoices: string[][] = [];
  const openedFiles: string[] = [];
  const shownFiles: string[] = [];
  const revealedFiles: string[] = [];
  const timers = new Map<ReturnType<typeof setTimeout>, { callback: () => void; delay: number }>();
  let choice: string | undefined;
  const disposable = { dispose() { } };
  const fireConfiguration = (key: string) => configurationListeners.forEach(listener => listener({
    affectsConfiguration: section => key === section || key.startsWith(`${section}.`),
  }));
  const host = {
    version: '1.141.0',
    Uri: { joinPath: (base: URL, ...parts: string[]) => new URL(parts.join('/'), base), file: (fsPath: string) => ({ fsPath }) },
    ExtensionMode: { Production: 1, Development: 2, Test: 3 }, StatusBarAlignment: { Right: 2 },
    ThemeColor: class { constructor(public id: string) { } },
    MarkdownString: class { constructor(public value: string) { } },
    commands: {
      registerCommand: (id: string, callback: () => Promise<void>) => {
        commands.set(id, callback);
        return disposable;
      },
      executeCommand: async (id: string, uri?: { fsPath: string }) => {
        if (id === 'revealFileInOS' && uri) revealedFiles.push(uri.fsPath);
      },
    },
    window: {
      createStatusBarItem: () => ({ text: '', show() { }, dispose() { } }),
      showTextDocument: async (document: { fsPath: string }) => { shownFiles.push(document.fsPath); },
      showInformationMessage: async () => {},
      showErrorMessage: async () => {},
      showQuickPick: async (items: Array<{ provider: string }>) => {
        pickedChoices.push(Array.from(items, item => item.provider));
        return items.find(item => item.provider === choice);
      },
    },
    workspace: {
      isTrusted: options.trusted ?? true,
      openTextDocument: async (uri: { fsPath: string }) => {
        openedFiles.push(uri.fsPath);
        return options.openDocument ? options.openDocument(uri) : uri;
      },
      getConfiguration: (section: string) => ({
        get: (key: string, fallback?: unknown) => settings[`workspace:${section}.${key}`] ?? settings[`${section}.${key}`] ?? fallback,
        inspect: (key: string) => {
          const value = settings[`${section}.${key}`];
          return { key, globalValue: value, workspaceValue: settings[`workspace:${section}.${key}`] };
        },
        update: async (key: string, value: unknown) => {
          settings[`${section}.${key}`] = value;
          fireConfiguration(`${section}.${key}`);
        },
      }),
      onDidChangeConfiguration: (listener: (event: vscode.ConfigurationChangeEvent) => void) => {
        configurationListeners.push(listener);
        return disposable;
      },
      onDidGrantWorkspaceTrust: () => disposable,
    },
    authentication: {
      getSession: async (provider: string, scopes: string[], authOptions: vscode.AuthenticationGetSessionOptions) => {
        authCalls.push({ provider, scopes, options: authOptions });
        return options.authenticate ? options.authenticate(provider, authOptions) : session(provider);
      },
      onDidChangeSessions: (listener: (event: { provider: { id: string } }) => void) => {
        sessionListeners.push(listener);
        return disposable;
      },
    },
    ConfigurationTarget: { Global: 1 },
    extensions: {
      getExtension: () => ({
        packageJSON: {
          contributes: {
            configuration: [{
              properties:
                options.pluralSupported === false ? { 'github-enterprise.uri': {} } : { 'github-enterprise.uris': {} },
            }]
          }
        }
      })
    },
  };
  const http = {
    request: (url: string, requestOptions: { headers: { Authorization: string }; signal: AbortSignal }, callback: (response: EventEmitter) => void) => {
      const quotaRequest = url.endsWith('/copilot_internal/user');
      const captured = { url, token: requestOptions.headers.Authorization, signal: requestOptions.signal };
      allRequests.push(captured);
      if (quotaRequest) requests.push(captured);
      const request = new EventEmitter() as EventEmitter & { end(): void; destroy(error: Error): void };
      request.destroy = error => {
        request.emit('error', error);
        request.emit('close');
      };
      requestOptions.signal.addEventListener('abort', () => request.destroy(new Error('Aborted')), { once: true });
      const respond = () => {
        const result = quotaRequest ? { status: 200, body: boundedFixture(100, 25, new Date(options.now?.() ?? Date.now())) }
          : options.apiResponse?.(url) ?? { status: 403, body: undefined };
        const response = Object.assign(new EventEmitter(), { statusCode: result.status, headers: {} });
        callback(response);
        if (result.body !== undefined) response.emit('data', Buffer.from(JSON.stringify(result.body)));
        response.emit('end');
        request.emit('close');
      };
      if (quotaRequest) responses.push(respond);
      request.end = () => queueMicrotask(() => { if (!quotaRequest || !options.pendingNetwork) respond(); });
      return request;
    },
  };
  const context = {
    extensionMode: 3, extensionUri: new URL('file:///extension/'), subscriptions: [] as vscode.Disposable[],
    globalStorageUri: options.storageDirectory ? { fsPath: options.storageDirectory } : undefined,
  };
  const module = { exports: {} as { activate: typeof activate } };
  const runtimeDate = options.now ? class extends Date {
    constructor(value?: string | number) { super(value ?? options.now!()); }
    static now() { return options.now!(); }
  } : Date;
  runInNewContext(readFileSync('out/development/dist/extension.js', 'utf8'), {
    module, exports: module.exports,
    require: (id: string) => {
      if (id === 'vscode') return host;
      if (id === 'node:https') return http;
      if (id === 'node:fs/promises' && (options.beforeHistoryRead || options.beforeHistoryWrite)) return {
        ...loadNodeModule(id),
        readFile: async (file: string) => {
          await options.beforeHistoryRead?.(file);
          return readFile(file);
        },
        writeFile: async (file: string, data: string, writeOptions: Parameters<typeof writeFile>[2]) => {
          await options.beforeHistoryWrite?.(file);
          return writeFile(file, data, writeOptions);
        },
      };
      return loadNodeModule(id);
    },
    Date: runtimeDate, Intl, URL, URLSearchParams, Buffer, AbortController, AbortSignal,
    setTimeout: (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.set(timer, { callback, delay });
      return timer;
    },
    clearTimeout: (timer: ReturnType<typeof setTimeout>) => {
      timers.delete(timer);
      clearTimeout(timer);
    },
  });
  const api = module.exports.activate(context as unknown as vscode.ExtensionContext) as TestApi;
  return {
    api, authCalls, requests, allRequests, settings, pickedChoices, openedFiles, shownFiles, revealedFiles, timers,
    fireTimer: (delay: number) => {
      const selected = [...timers].find(([, task]) => task.delay === delay);
      assert.ok(selected, `No timer scheduled for ${delay}ms`);
      const [timer, task] = selected;
      clearTimeout(timer);
      timers.delete(timer);
      task.callback();
    },
    choose: (provider: string | undefined) => { choice = provider; },
    connect: () => commands.get('copilotPace.connect')!(),
    completeRequest: (index: number) => responses[index]!(),
    set: (key: string, value: unknown) => {
      settings[key] = value;
      fireConfiguration(key);
    },
    sessionChanged: (provider: string) => sessionListeners.forEach(listener => listener({ provider: { id: provider } })),
    dispose: () => api.dispose(),
  };
}

describe('Connection integration with native VS Code services', () => {
  for (const enterprise of [false, true]) {
    it(`retrieves daily reports silently on the matched ${enterprise ? 'Enterprise' : 'GitHub.com'} API host`, async () => {
      const now = new Date();
      const settings = enterprise ? { 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://corp.ghe.com' } : {};
      const host = harness(settings, { apiResponse: raw => {
        const url = new URL(raw);
        if (url.pathname === '/user') return { status: 200, body: { login: 'octocat', id: 'same-account-id' } };
        if (url.pathname.startsWith('/users/octocat/settings/billing/ai_credit/usage')) return { status: 200, body: {
          user: 'octocat', timePeriod: { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1,
            ...(url.searchParams.has('day') ? { day: Number(url.searchParams.get('day')) } : {}) },
          usageItems: [{ product: 'Copilot', unitType: 'credits', grossQuantity: 5 }],
        } };
        return { status: 403, body: undefined };
      } });
      try {
        for (let attempt = 0; attempt < 10 && !host.api.getState().dailyUsage?.length; attempt++) await settle();
        assert.ok(host.api.getState().dailyUsage!.length > 0);
        assert.equal(host.api.getState().phase, 'ready');
        assert.equal(host.authCalls.length, 1);
        assert.deepEqual([...host.authCalls[0]!.scopes], ['read:user']);
        assert.equal(host.authCalls[0]!.options.silent, true);
        assert.ok(host.allRequests.every(request => new URL(request.url).origin === (enterprise ? 'https://api.corp.ghe.com' : 'https://api.github.com')));
        assert.ok(host.allRequests.every(request => request.token === `Bearer ${enterprise ? 'github-enterprise' : 'github'}-synthetic`));
      } finally { host.dispose(); }
    });
  }
  it('persists accepted account observations and restores them across extension activations', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'copilot-pace-activation-history-'));
    const key = historyIdentity('github', 'https://github.com', 'same-account-id');
    const store = new HistoryStore(directory);
    const now = new Date();
    const cycle = { start: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1), end: Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) };
    const first = harness({}, { storageDirectory: directory });
    let second: ReturnType<typeof harness> | undefined;
    try {
      const deadline = Date.now() + 5000;
      while ((await store.read(key, Date.now(), cycle)).length === 0) {
        assert.ok(Date.now() < deadline, 'Accepted observation was not persisted');
        await settle();
      }
      const saved = await store.read(key, Date.now(), cycle);
      assert.equal(saved.length, 1);
      first.dispose();
      second = harness({}, { storageDirectory: directory, pendingNetwork: true });
      await settle();
      second.completeRequest(0);
      while ((await store.read(key, Date.now(), cycle)).length < 2) {
        assert.ok(Date.now() < deadline, 'Second activation did not retain the first observation');
        await settle();
      }
      const restored = await store.read(key, Date.now(), cycle);
      assert.ok(restored.some(item => item.at === saved[0]!.at));
      assert.ok(second.api.getModel().history.length >= 1);
    } finally {
      first.dispose();
      second?.dispose();
      await rm(directory, { recursive: true, force: true });
    }
  });
  it('restores the daily chart beside a corrupted journal while accepting and saving fresh quota', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'copilot-pace-corrupt-history-'));
    const key = historyIdentity('github', 'https://github.com', 'same-account-id');
    const now = Date.parse('2026-10-21T12:00Z');
    const cycle = { start: Date.parse('2026-10-01T00:00Z'), end: Date.parse('2026-11-01T00:00Z') };
    const saved = [
      { ...cycle, at: now - 3_600_000, used: 10, total: 100 },
      { ...cycle, at: now - 1_800_000, used: 20, total: 100 },
    ];
    const healthyFile = join(directory, `${key}.2026-10-21.00000000-0000-0000-0000-000000000000.json`);
    const damagedFile = join(directory, `${key}.2026-10-20.00000000-0000-0000-0000-000000000001.json`);
    const body = JSON.stringify({ version: 1, observations: saved });
    await writeFile(healthyFile, body);
    await writeFile(damagedFile, '{"version":1,"observations":[');
    const store = new HistoryStore(directory);
    const host = harness({ 'copilotPace.chartMetric': 'daily' }, { storageDirectory: directory, now: () => now });
    try {
      const deadline = Date.now() + 5000;
      while ((await store.read(key, now, cycle)).length !== 3 || !host.api.getModel().canOpenHistory) {
        assert.ok(Date.now() < deadline, 'Healthy daily history and fresh quota were not restored');
        await settle();
      }

      const model = host.api.getModel();
      assert.equal(host.api.getState().phase, 'ready');
      assert.equal(model.percentage, '25%');
      assert.equal(model.used, '25 credits');
      assert.equal(model.historyLatest, '15 credits');
      assert.equal(model.history.length, 1);
      assert.equal(model.history[0]!.partial, true);
      assert.equal(model.historyMessage, model.text.historyDailyNote);
      assert.equal(await readFile(healthyFile, 'utf8'), body);
      assert.equal(await readFile(damagedFile, 'utf8'), '{"version":1,"observations":[');
      assert.equal((await readdir(directory)).length, 3);
    } finally {
      host.dispose();
      await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    }
  });
  for (const [operation, code] of [['read', 'EACCES'], ['write', 'EACCES'], ['write', 'ENOSPC']] as const) {
    it(`keeps accepted quota visible after a history ${operation} fails with ${code} and recovers on refresh`, async () => {
      const directory = await mkdtemp(join(tmpdir(), 'copilot-pace-storage-failure-'));
      const key = historyIdentity('github', 'https://github.com', 'same-account-id');
      let now = Date.parse('2026-10-21T12:00Z');
      const cycle = { start: Date.parse('2026-10-01T00:00Z'), end: Date.parse('2026-11-01T00:00Z') };
      const file = join(directory, `${key}.2026-10-21.00000000-0000-0000-0000-000000000000.json`);
      const body = JSON.stringify({ version: 1, observations: [
        { ...cycle, at: now - 3_600_000, used: 10, total: 100 },
        { ...cycle, at: now - 1_800_000, used: 20, total: 100 },
      ] });
      await writeFile(file, body);
      let failing = true;
      let failedOperations = 0;
      const host = harness({ 'copilotPace.chartMetric': 'daily' }, {
        storageDirectory: directory,
        now: () => now,
        beforeHistoryRead: async path => {
          if (failing && operation === 'read' && path === file) {
            failedOperations++;
            throw Object.assign(new Error('Synthetic storage read failure'), { code });
          }
        },
        beforeHistoryWrite: async temporary => {
          if (failing && operation === 'write') {
            failedOperations++;
            // A full disk can leave a partial temporary file before writeFile rejects.
            if (code === 'ENOSPC') await writeFile(temporary, '{"version":1,', { flag: 'wx' });
            throw Object.assign(new Error('Synthetic storage write failure'), { code });
          }
        },
      });
      try {
        const deadline = Date.now() + 5000;
        const expectedFailures = operation === 'read' ? 2 : 1;
        while (failedOperations < expectedFailures || host.api.getState().phase !== 'ready' ||
            host.api.getModel().historyMessage !== host.api.getModel().text.historyError) {
          assert.ok(Date.now() < deadline, 'Storage failure was not reported alongside accepted quota');
          await settle();
        }

        assert.equal(host.api.getModel().percentage, '25%');
        assert.equal(host.api.getModel().used, '25 credits');
        assert.equal(await readFile(file, 'utf8'), body);
        assert.ok((await readdir(directory)).every(name => name.endsWith('.json')));

        failing = false;
        now += 60_000;
        await host.api.receiveMessage({ action: 'refresh' });
        const store = new HistoryStore(directory);
        while (!(await store.read(key, now, cycle)).some(item => item.at === now) ||
            !host.api.getModel().canOpenHistory ||
            host.api.getModel().historyMessage !== host.api.getModel().text.historyDailyNote) {
          assert.ok(Date.now() < deadline, 'History did not recover after storage became available');
          await settle();
        }

        assert.equal(host.api.getState().phase, 'ready');
        assert.equal(host.api.getModel().historyLatest, '15 credits');
        assert.equal(host.api.getModel().history.length, 1);
        assert.equal(host.api.getModel().history[0]!.partial, true);
        assert.equal(await readFile(file, 'utf8'), body);
        assert.ok((await readdir(directory)).every(name => name.endsWith('.json')));
      } finally {
        host.dispose();
        await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
      }
    });
  }
  it('prunes storage at activation and the next UTC day without a GitHub session, then stops on dispose', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'copilot-pace-maintenance-'));
    const key = historyIdentity('github', 'https://github.com', 'maintenance-account');
    let now = Date.parse('2026-10-21T12:00Z');
    const expired = `${key}.2026-07-01.00000000-0000-0000-0000-000000000000.json`;
    await writeFile(join(directory, expired), '{broken');
    const host = harness({}, { storageDirectory: directory, authenticate: async () => undefined, now: () => now });
    try {
      const deadline = Date.now() + 5000;
      while ((await readdir(directory)).length || ![...host.timers.values()].some(timer => timer.delay === 12 * 3_600_000)) {
        assert.ok(Date.now() < deadline, 'Startup maintenance did not finish');
        await settle();
      }
      assert.equal(host.api.getState().phase, 'disconnected');
      assert.equal(host.requests.length, 0);
      const authCalls = host.authCalls.length;
      await writeFile(join(directory, expired), '{broken');
      now = Date.parse('2026-10-22T00:00Z');

      host.fireTimer(12 * 3_600_000);

      while ((await readdir(directory)).length || ![...host.timers.values()].some(timer => timer.delay === 24 * 3_600_000)) {
        assert.ok(Date.now() < deadline, 'Daily maintenance did not finish');
        await settle();
      }
      assert.equal(host.authCalls.length, authCalls);
      assert.equal(host.requests.length, 0);
      host.dispose();
      assert.equal(host.timers.size, 0);
    } finally {
      host.dispose();
      await rm(directory, { recursive: true, force: true });
    }
  });
  it('ignores a late history failure after the account has entered a new cycle', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'copilot-pace-cycle-history-'));
    const key = historyIdentity('github', 'https://github.com', 'same-account-id');
    let now = Date.parse('2026-10-21T12:00Z');
    const file = join(directory, `${key}.2026-10-21.00000000-0000-0000-0000-000000000000.json`);
    await writeFile(file, JSON.stringify({ version: 1, observations: [] }));
    let rejectRead!: (error: Error) => void;
    let delayed = false;
    const host = harness({}, { storageDirectory: directory, now: () => now, beforeHistoryRead: async path => {
      if (path === file && !delayed) {
        delayed = true;
        await new Promise<void>((_resolve, reject) => { rejectRead = reject; });
      }
    } });
    try {
      const deadline = Date.now() + 5000;
      while (!delayed) {
        assert.ok(Date.now() < deadline, 'Initial history read did not start');
        await settle();
      }
      now = Date.parse('2026-11-02T12:00Z');
      await host.api.receiveMessage({ action: 'refresh' });
      while (!host.api.getModel().history.length || !host.api.getModel().canOpenHistory ||
          !(await readdir(directory)).some(name => name.includes('.2026-11-02.') && name.endsWith('.json'))) {
        assert.ok(Date.now() < deadline, 'New cycle observations did not become available');
        await settle();
      }

      rejectRead(Object.assign(new Error('History read denied'), { code: 'EACCES' }));
      await settle();

      assert.equal(host.api.getState().snapshot?.cycle?.start, now - 36 * 3_600_000);
      assert.equal(host.api.getModel().historyMessage, host.api.getModel().text.historyNote);
    } finally {
      rejectRead?.(new Error('Test disposed'));
      host.dispose();
      await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    }
  });
  it('opens only the active account journal and clears file access when the account disconnects', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'copilot-pace-open-history-'));
    let authenticated = true;
    let delayOpen = false;
    let completeOpen!: () => void;
    const host = harness({}, {
      storageDirectory: directory,
      authenticate: async () => authenticated ? session('github') : undefined,
      openDocument: async uri => {
        if (delayOpen) await new Promise<void>(resolve => { completeOpen = resolve; });
        return uri;
      },
    });
    try {
      const deadline = Date.now() + 5000;
      while (!host.api.getModel().canOpenHistory) {
        assert.ok(Date.now() < deadline, 'Journal actions did not become available');
        await settle();
      }
      const file = await new HistoryStore(directory).latestFile(historyIdentity('github', 'https://github.com', 'same-account-id'));
      assert.ok(file);
      assert.equal(host.api.getModel().showHistoryFile, true);
      assert.ok(!JSON.stringify(host.api.getModel()).includes(directory));
      await host.api.receiveMessage({ action: 'revealHistory', value: 'C:\\untrusted-path.json' });
      assert.deepEqual(host.revealedFiles, [file]);
      await host.api.receiveMessage({ action: 'openHistory', value: 'C:\\untrusted-path.json' });
      assert.deepEqual(host.openedFiles, [file]);
      assert.deepEqual(host.shownFiles, [file]);
      delayOpen = true;
      const pendingOpen = host.api.receiveMessage({ action: 'openHistory' });
      while (host.openedFiles.length < 2) {
        assert.ok(Date.now() < deadline, 'Document open did not start');
        await settle();
      }
      authenticated = false;
      host.sessionChanged('github');
      assert.equal(host.api.getModel().canOpenHistory, false);
      assert.equal(host.api.getModel().showHistoryFile, false);
      completeOpen();
      await pendingOpen;
      assert.deepEqual(host.shownFiles, [file]);
      await host.api.receiveMessage({ action: 'openHistory' });
      await host.api.receiveMessage({ action: 'revealHistory' });
      assert.equal(host.openedFiles.length, 2);
      assert.deepEqual(host.revealedFiles, [file]);
    } finally {
      host.dispose();
      await rm(directory, { recursive: true, force: true });
    }
  });
  for (const plan of ['personal', 'Business']) {
    it(`preserves normal ${plan} login and quota requests without an extra picker`, async () => {
      const host = harness({}, { authenticate: async () => session(plan) });
      try {
        await settle();
        await host.connect();
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
    try {
      await settle();
      assert.equal(host.authCalls[0]?.provider, 'github');
    }
    finally { host.dispose(); }
  });
  it('offers both providers and switches back to GitHub.com without changing Copilot settings', async () => {
    const advanced = { authProvider: 'github-enterprise' };
    const host = harness({ 'github.copilot.advanced': advanced, 'github-enterprise.uri': 'https://corp.ghe.com' });
    try {
      await settle();
      host.choose('github');
      await host.connect();
      assert.deepEqual(host.pickedChoices[0], ['github-enterprise', 'github']);
      assert.equal(host.settings['copilotPace.authProvider'], 'github');
      assert.equal(host.settings['github.copilot.advanced'], advanced);
      assert.equal(host.requests.at(-1)?.url, 'https://api.github.com/copilot_internal/user');
      assert.equal(host.requests.at(-1)?.token, 'Bearer github-synthetic');
      assert.equal(host.api.getModel().accountLabel, 'github');
      host.choose('github-enterprise');
      await host.connect();
      assert.equal(host.requests.at(-1)?.url, 'https://api.corp.ghe.com/copilot_internal/user');
    } finally { host.dispose(); }
  });
  it('cancels provider selection without changing account, quota or configuration', async () => {
    const host = harness({ 'github-enterprise.uri': 'https://corp.ghe.com' });
    try {
      await settle();
      const before = host.api.getState();
      const calls = host.authCalls.length;
      await host.connect();
      assert.equal(host.api.getState(), before);
      assert.equal(host.authCalls.length, calls);
      assert.equal(host.settings['copilotPace.authProvider'], undefined);
    } finally { host.dispose(); }
  });
  it('cancels native corporate login without attempting GitHub.com', async () => {
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://corp.ghe.com' }, {
      authenticate: async (_provider, options) => {
        if (!options.silent) throw new Error('Cancelled');
        return undefined;
      },
    });
    try {
      await settle();
      host.choose('github-enterprise');
      await host.connect();
      assert.ok(host.authCalls.every(call => call.provider === 'github-enterprise'));
      assert.equal(host.requests.length, 0);
      assert.equal(host.api.getState().failure?.code, 'auth');
    } finally { host.dispose(); }
  });
  it('does not send any credential when several Enterprise instances could own the session', async () => {
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uris': ['https://one.ghe.com', 'https://two.ghe.com'] });
    try {
      await settle();
      assert.equal(host.authCalls.length, 0);
      assert.equal(host.requests.length, 0);
      assert.equal(host.api.getState().failure?.code, 'configuration');
      assert.equal(host.api.getState().snapshot, undefined);
    } finally { host.dispose(); }
  });
  it('ignores untrusted workspace instance settings and uses only the user instance', async () => {
    const host = harness({
      'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://user.ghe.com',
      'workspace:github-enterprise.uris': ['https://untrusted.example.com']
    }, { trusted: false });
    try {
      await settle();
      assert.equal(host.requests[0]?.url, 'https://api.user.ghe.com/copilot_internal/user');
    }
    finally { host.dispose(); }
  });
  it('uses the effective workspace instance when the workspace is trusted', async () => {
    const host = harness({
      'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://user.ghe.com',
      'workspace:github-enterprise.uris': ['https://trusted.ghe.com']
    });
    try {
      await settle();
      assert.equal(host.requests[0]?.url, 'https://api.trusted.ghe.com/copilot_internal/user');
    }
    finally { host.dispose(); }
  });
  it('deduplicates repeated connect actions', async () => {
    const host = harness({ 'github-enterprise.uri': 'https://corp.ghe.com' });
    try {
      await settle();
      host.choose('github-enterprise');
      const first = host.connect();
      const second = host.connect();
      assert.equal(first, second);
      await first;
      assert.equal(host.pickedChoices.length, 1);
      assert.equal(host.authCalls.filter(call => call.options.createIfNone).length, 1);
    } finally { host.dispose(); }
  });
  for (const provider of ['github', 'github-enterprise']) {
    for (const synchronousEvent of [false, true]) {
      for (const staleAccount of [undefined, 'previous-account']) {
        it(`rechecks ${provider} after a pre-login lookup returns ${staleAccount ?? 'no session'} late (${synchronousEvent ? 'synchronous' : 'asynchronous'} event)`, async () => {
          let connected = false;
          let silentReads = 0;
          let completeBackground!: (value: vscode.AuthenticationSession | undefined) => void;
          let loginReturned!: () => void;
          const nativeLogin = new Promise<void>(resolve => { loginReturned = resolve; });
          const host = harness({ 'copilotPace.authProvider': provider, 'github-enterprise.uri': 'https://corp.ghe.com' }, {
            authenticate: async (selected, options) => {
              if (options.silent) {
                if (++silentReads === 1) return undefined;
                if (connected) return session(selected);
                return new Promise(resolve => { completeBackground = resolve; });
              }
              if (!synchronousEvent) await settle();
              host.sessionChanged(selected);
              await settle();
              connected = true;
              loginReturned();
              return session(selected);
            },
          });
          try {
            await settle();
            host.choose(provider);
            const login = host.connect();
            await nativeLogin;
            await settle();
            assert.equal(connected, true);
            completeBackground(staleAccount ? {
              ...session(provider), id: 'previous-session',
              account: { id: staleAccount, label: staleAccount },
            } : undefined);
            await login;
            await settle();
            assert.equal(host.api.getState().phase, 'ready');
            assert.equal(host.api.getModel().accountLabel, provider === 'github' ? provider : `${provider} (corp.ghe.com)`);
            assert.equal(host.authCalls.at(-1)?.options.silent, true);
            assert.equal(host.authCalls.filter(call => call.options.createIfNone).length, 1);
          } finally { host.dispose(); }
        });
      }
    }
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
        await settle();
        host.choose(provider);
        await host.connect();
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
        await settle();
        host.choose(provider);
        const login = host.connect();
        await settle();
        host.sessionChanged(provider);
        await settle();
        complete(session(provider));
        await login;
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
        await settle();
        host.completeRequest(0);
        await settle();
        assert.equal(host.api.getState().phase, 'ready');
        const refresh = host.api.receiveMessage({ action: 'refresh' });
        await settle();
        connected = false;
        host.sessionChanged(provider);
        assert.equal(host.api.getState().snapshot, undefined);
        assert.equal(host.api.getState().account, undefined);
        assert.equal(host.api.getState().updatedAt, undefined);
        assert.equal(host.api.getModel().accountLabel, '');
        assert.equal(host.api.getModel().history.length, 0);
        assert.equal(host.api.getModel().used, '—');
        assert.equal(host.requests[1]?.signal.aborted, true);
        await refresh;
        await settle();
        host.completeRequest(1);
        await settle();
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
        await settle();
        host.set('copilotPace.authProvider', next);
        await settle();
        assert.equal(host.requests[0]?.signal.aborted, true);
        assert.equal(host.api.getState().snapshot, undefined);
        host.completeRequest(1);
        await settle();
        assert.equal(host.api.getState().phase, 'ready');
        const current = host.api.getState();
        host.completeRequest(0);
        host.sessionChanged(provider);
        await settle();
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
      await settle();
      host.completeRequest(0);
      await settle();
      assert.equal(host.api.getModel().accountLabel, 'personal');
      assert.equal(host.api.getModel().history.length, 1);
      selected = 'Business';
      host.sessionChanged('github');
      assert.equal(host.api.getState().snapshot, undefined);
      assert.equal(host.api.getState().account, undefined);
      assert.equal(host.api.getModel().history.length, 0);
      await settle();
      assert.equal(host.api.getModel().accountLabel, 'Business');
      assert.equal(host.api.getState().snapshot, undefined);
      host.completeRequest(1);
      await settle();
      assert.equal(host.api.getState().phase, 'ready');
      assert.equal(host.api.getModel().history.length, 1);
      assert.ok(host.authCalls.every(call => call.provider === 'github' && call.options.silent));
    } finally { host.dispose(); }
  });
  it('ignores plural settings when the running authentication extension only supports the legacy URI', async () => {
    const host = harness({
      'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://legacy.ghe.com',
      'github-enterprise.uris': ['https://unsupported.ghe.com']
    }, { pluralSupported: false });
    try {
      await settle();
      assert.equal(host.requests[0]?.url, 'https://api.legacy.ghe.com/copilot_internal/user');
    }
    finally { host.dispose(); }
  });
  it('does not use the legacy URI when an explicitly empty supported plural list disables instances', async () => {
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://legacy.ghe.com', 'github-enterprise.uris': [] });
    try {
      await settle();
      assert.equal(host.authCalls.length, 0);
      assert.equal(host.requests.length, 0);
      assert.equal(host.api.getState().failure?.code, 'configuration');
    } finally { host.dispose(); }
  });
  it('cancels the old request and requires reload when the enterprise host changes before its provider catches up', async () => {
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://old.ghe.com' }, { pendingNetwork: true });
    try {
      await settle();
      const old = host.requests[0]!;
      host.set('github-enterprise.uri', 'https://new.ghe.com');
      await settle();
      assert.equal(old.signal.aborted, true);
      assert.equal(host.requests.length, 1);
      assert.equal(host.authCalls.length, 1);
      assert.equal(host.api.getState().failure?.code, 'configurationChanged');
      assert.equal(host.api.getState().snapshot, undefined);
      assert.equal(host.api.getModel().accountLabel, '');
      host.set('copilotPace.authProvider', 'github');
      await settle();
      assert.equal(host.requests.at(-1)?.url, 'https://api.github.com/copilot_internal/user');
    } finally { host.dispose(); }
  });
  it('ignores unrelated provider events and clears quota when the selected provider loses its session', async () => {
    let connected = true;
    const host = harness({ 'copilotPace.authProvider': 'github-enterprise', 'github-enterprise.uri': 'https://corp.ghe.com' }, {
      authenticate: async provider => connected ? session(provider) : undefined,
    });
    try {
      await settle();
      const calls = host.authCalls.length;
      host.sessionChanged('github');
      await settle();
      assert.equal(host.authCalls.length, calls);
      connected = false;
      host.sessionChanged('github-enterprise');
      await settle();
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
      await settle();
      host.set('copilotPace.authProvider', 'github');
      await settle();
      complete(session('github-enterprise'));
      await settle();
      assert.equal(host.requests.length, 1);
      assert.equal(host.requests[0]?.url, 'https://api.github.com/copilot_internal/user');
      assert.equal(host.api.getModel().accountLabel, 'github');
    } finally { host.dispose(); }
  });
});
