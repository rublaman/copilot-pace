import type * as vscode from 'vscode';
import type { SessionProvider } from './transport';
import { getStrings, type Language } from './i18n';

export class GitHubSessions implements SessionProvider {
  constructor(private readonly authentication: Pick<typeof vscode.authentication, 'getSession'>, private readonly getLanguage: () => Language = () => 'en') {}

  async get(interactive: boolean, forceNewSession = false) {
    const text = getStrings(this.getLanguage());
    const options: vscode.AuthenticationGetSessionOptions = !interactive ? { silent: true }
      : forceNewSession ? {
        forceNewSession: { detail: text.reconnectDetail },
        clearSessionPreference: true,
      } : {
        createIfNone: { detail: text.connectDetail },
        clearSessionPreference: true,
      };
    const session = await this.authentication.getSession('github', ['read:user'], options);
    return session ? {
      id: session.id, accessToken: session.accessToken,
      account: { id: session.account.id, label: session.account.label },
    } : undefined;
  }
}
