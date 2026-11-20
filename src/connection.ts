export type AuthProvider = 'github' | 'github-enterprise';
export interface ConnectionSettings {
  provider?: unknown;
  copilotProvider?: unknown;
  enterpriseUri?: unknown;
  enterpriseUris?: unknown;
}
export interface Connection {
  provider: AuthProvider;
  origins: readonly string[];
  invalid: boolean;
  enterpriseAvailable: boolean;
  key: string;
  requiresReload?: boolean;
}

function enterpriseOrigin(value: unknown): string {
  // The native provider uses the api.<instance>.ghe.com pattern for hosted instances.
  if (typeof value !== 'string' || !/^https:\/\/[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.ghe\.com\/?$/.test(value)) {
    throw new Error('Invalid instance');
  }
  return new URL(value).origin;
}

export function resolveConnection(settings: ConnectionSettings): Connection {
  let provider: AuthProvider = 'github';
  if (settings.provider !== 'github' && (settings.provider === 'github-enterprise' || settings.copilotProvider === 'github-enterprise')) {
    provider = 'github-enterprise';
  }
  let values = settings.enterpriseUris;
  if (values === undefined) values = settings.enterpriseUri ? [settings.enterpriseUri] : [];
  let origins: string[] = [];
  let invalid = false;
  try {
    if (!Array.isArray(values)) throw new Error('Invalid instances');
    origins = [...new Set(values.map(enterpriseOrigin))].sort();
  } catch { invalid = true; }
  return Object.freeze({
    provider, origins: Object.freeze(origins), invalid,
    enterpriseAvailable: invalid || origins.length > 0 || provider === 'github-enterprise',
    // Invalid input is never included in diagnostics, identity or presentation.
    key: provider === 'github' ? 'github' : `github-enterprise:${invalid ? 'invalid' : origins.join(',')}`,
  });
}

export const defaultConnection = resolveConnection({});

export function quotaEndpoint(connection: Connection): string | undefined {
  if (connection.provider === 'github') return 'https://api.github.com/copilot_internal/user';
  if (connection.requiresReload || connection.invalid || connection.origins.length !== 1) return undefined;
  try {
    const origin = enterpriseOrigin(connection.origins[0]);
    return `https://api.${new URL(origin).hostname}/copilot_internal/user`;
  } catch { return undefined; }
}
