import * as assert from 'node:assert/strict';
import type * as vscode from 'vscode';
import { GitHubSessions } from '../../src/sessions';

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
});
