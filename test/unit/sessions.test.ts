import * as assert from 'node:assert/strict';
import type * as vscode from 'vscode';
import { GitHubSessions } from '../../src/sessions';
import { resolveConnection } from '../../src/connection';

describe('GitHub session options', () => {
  it('uses the current Spanish preference for interactive prompts without changing scopes or silent behavior', async () => {
    const calls: unknown[][] = [];
    const getSession = (async (...args: unknown[]) => { calls.push(args); return undefined; }) as unknown as typeof vscode.authentication.getSession;
    const sessions = new GitHubSessions({ getSession }, () => 'es-ES');
    await sessions.get(false); await sessions.get(true); await sessions.get(true, true);
    assert.deepEqual(calls, [
      ['github', ['read:user'], { silent: true }],
      ['github', ['read:user'], { createIfNone: { detail: 'Elige una cuenta de GitHub para consultar su consumo de Copilot.' }, clearSessionPreference: true }],
      ['github', ['read:user'], { forceNewSession: { detail: 'Vuelve a conectar con GitHub para consultar tu consumo de Copilot.' }, clearSessionPreference: true }],
    ]);
  });
  for (const [interactive, forceNewSession, expected] of [
    [false, false, { silent: true }],
    [false, true, { silent: true }],
    [true, false, {
      createIfNone: { detail: 'Choose a GitHub account to view its Copilot usage.' },
      clearSessionPreference: true,
    }],
    [true, true, {
      forceNewSession: { detail: 'Reconnect GitHub to view your Copilot usage.' },
      clearSessionPreference: true,
    }],
  ] as const) {
    it(`uses ${JSON.stringify(expected)} for interactive=${interactive}, forceNewSession=${forceNewSession}`, async () => {
      const sessions = new GitHubSessions({
        getSession: async (...args: Parameters<typeof vscode.authentication.getSession>) => {
          assert.deepEqual(args, ['github', ['read:user'], expected]);
          return { id: 'session', accessToken: 'synthetic', account: { id: 'account', label: 'Test' }, scopes: ['read:user'] };
        },
      });
      assert.deepEqual(await sessions.get(interactive, forceNewSession), {
        id: 'session', accessToken: 'synthetic', account: { id: 'account', label: 'Test' },
      });
    });
  }
  it('returns no identity when VS Code has no authorized session', async () => {
    const getSession = (async () => undefined) as unknown as typeof vscode.authentication.getSession;
    const sessions = new GitHubSessions({ getSession });
    assert.equal(await sessions.get(false), undefined);
  });
  it('uses the native Enterprise provider with the same minimal scopes and silent/reconnection behavior', async () => {
    const calls: unknown[][] = [];
    const sessions = new GitHubSessions({ getSession: (async (...args: unknown[]) => {
      calls.push(args);
      return { id: 'enterprise', accessToken: 'synthetic', account: { id: 'user', label: 'Corporate' }, scopes: ['read:user'] };
    }) as unknown as typeof vscode.authentication.getSession }, () => 'en',
    resolveConnection({ provider: 'github-enterprise', enterpriseUri: 'https://corp.ghe.com' }));
    assert.equal((await sessions.get(false))?.account.label, 'Corporate (corp.ghe.com)');
    await sessions.get(true); await sessions.get(true, true);
    assert.deepEqual(calls.map(call => call.slice(0, 2)), Array.from({ length: 3 }, () => ['github-enterprise', ['read:user']]));
    assert.deepEqual(calls[0]?.[2], { silent: true });
    assert.deepEqual(calls[2]?.[2], { forceNewSession: { detail: 'Reconnect GitHub to view your Copilot usage.' }, clearSessionPreference: true });
  });
  it('does not fall back to GitHub.com when corporate consent is denied or login is cancelled', async () => {
    const calls: string[] = [];
    const sessions = new GitHubSessions({ getSession: (async (provider: string) => {
      calls.push(provider); throw new Error('Cancelled or denied');
    }) as unknown as typeof vscode.authentication.getSession }, () => 'en',
    resolveConnection({ provider: 'github-enterprise', enterpriseUri: 'https://corp.ghe.com' }));
    await assert.rejects(sessions.get(true));
    assert.deepEqual(calls, ['github-enterprise']);
  });
  it('rejects missing corporate settings before opening an unrelated login', async () => {
    let calls = 0;
    const sessions = new GitHubSessions({ getSession: (async () => { calls++; }) as unknown as typeof vscode.authentication.getSession }, () => 'en',
      resolveConnection({ provider: 'github-enterprise' }));
    await assert.rejects(sessions.get(true), { code: 'configuration' });
    assert.equal(calls, 0);
  });
  it('rejects multiple corporate instances before requesting credentials or opening a picker', async () => {
    const sessions = new GitHubSessions({ getSession: async () => assert.fail('Must not request a session') }, () => 'en',
      resolveConnection({ provider: 'github-enterprise', enterpriseUris: ['https://one.ghe.com', 'https://two.ghe.com'] }));
    await assert.rejects(sessions.get(false), { code: 'configuration' });
    await assert.rejects(sessions.get(true), { code: 'configuration' });
    await assert.rejects(sessions.get(true, true), { code: 'configuration' });
  });
});
