import type * as vscode from 'vscode';
import type { SessionProvider } from './transport';

export class GitHubSessions implements SessionProvider {
  constructor(private readonly authentication: Pick<typeof vscode.authentication, 'getSession'>) {}

  async get(interactive: boolean, forceNewSession = false) {
    const options: vscode.AuthenticationGetSessionOptions = !interactive ? { silent: true }
      : forceNewSession ? {
        forceNewSession: { detail: 'Reconnect GitHub to view your Copilot usage.' },
        clearSessionPreference: true,
      } : {
        createIfNone: { detail: 'Choose a GitHub account to view its Copilot usage.' },
        clearSessionPreference: true,
      };
    const session = await this.authentication.getSession('github', ['read:user'], options);
    return session ? {
      id: session.id, accessToken: session.accessToken,
      account: { id: session.account.id, label: session.account.label },
    } : undefined;
  }
}
