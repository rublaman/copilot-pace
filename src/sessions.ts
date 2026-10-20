import type * as vscode from 'vscode';
import { SafeError, type SessionProvider } from './transport';
import { getStrings, type Language } from './i18n';
import { defaultConnection, type Connection } from './connection';

export class GitHubSessions implements SessionProvider {
  constructor(private readonly authentication: Pick<typeof vscode.authentication, 'getSession'>, private readonly getLanguage: () => Language = () => 'en',
    private readonly connection: Connection = defaultConnection) {}

  async get(interactive: boolean, forceNewSession = false) {
    const text = getStrings(this.getLanguage());
    if (this.connection.provider === 'github-enterprise' && (this.connection.invalid || this.connection.origins.length !== 1)) {
      throw new SafeError('configuration', getStrings('en').errorConfiguration);
    }
    if (this.connection.provider === 'github-enterprise' && this.connection.requiresReload) {
      throw new SafeError('configurationChanged', getStrings('en').errorConfigurationChanged);
    }
    const options: vscode.AuthenticationGetSessionOptions = !interactive ? { silent: true }
      : forceNewSession ? {
        forceNewSession: { detail: text.reconnectDetail },
        clearSessionPreference: true,
      } : {
        createIfNone: { detail: text.connectDetail },
        clearSessionPreference: true,
      };
    const session = await this.authentication.getSession(this.connection.provider, ['read:user'], options);
    return session ? {
      id: session.id, accessToken: session.accessToken,
      account: { id: session.account.id, label: this.connection.provider === 'github-enterprise' && this.connection.origins.length === 1
        ? `${session.account.label} (${new URL(this.connection.origins[0]!).hostname})` : session.account.label },
    } : undefined;
  }
}
