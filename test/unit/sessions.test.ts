import * as assert from 'node:assert/strict';
import type * as vscode from 'vscode';
import { GitHubSessions } from '../../src/sessions';

describe('GitHub session options', () => {
  for (const [interactive, forceNewSession, expected] of [
    [false, false, { silent: true }],
    [false, true, { silent: true }],
    [true, false, { createIfNone: true, clearSessionPreference: true }],
    [true, true, { forceNewSession: true, clearSessionPreference: true }],
  ] as const) {
    it(`uses ${JSON.stringify(expected)} for interactive=${interactive}, forceNewSession=${forceNewSession}`, async () => {
      const sessions = new GitHubSessions({
        getSession: async (...args: Parameters<typeof vscode.authentication.getSession>) => {
          assert.deepEqual(args, ['github', ['read:user'], expected]);
          return { id: 'session', accessToken: 'synthetic', account: { id: 'account', label: 'Test' }, scopes: ['read:user'] };
        },
      });
      assert.deepEqual(await sessions.get(interactive, forceNewSession), { id: 'session', accessToken: 'synthetic' });
    });
  }
});
