import * as https from 'node:https';
import type { ClientRequest, IncomingMessage } from 'node:http';
import { defaultConnection, quotaEndpoint, type Connection } from './connection';
import { getStrings } from './i18n';

export interface SessionAccount { id: string; label: string }
export interface Session { id: string; accessToken: string; account: SessionAccount }
export interface SessionProvider { get(interactive: boolean, forceNewSession?: boolean): Promise<Session | undefined> }
export interface HttpResponse { status: number; headers: Record<string, string | undefined>; body: unknown }
export interface HttpTransport { request(accessToken: string, signal: AbortSignal): Promise<HttpResponse> }
export type FailureCode = 'timeout' | 'network' | 'invalidResponse' | 'unauthorized' | 'forbidden' | 'rateLimited' | 'server' | 'cancelled' | 'auth' | 'configuration' | 'configurationChanged';
export class SafeError extends Error {
  constructor(public readonly code: FailureCode, message: string, public readonly retryAt?: number) { super(message); }
}

export class GitHubTransport implements HttpTransport {
  constructor(private readonly editorVersion: string, private readonly timeoutMs = 10_000,
    private readonly requestFactory: (url: string, options: https.RequestOptions, callback: (response: IncomingMessage) => void) => ClientRequest = (url, options, callback) => https.request(url, options, callback),
    private readonly connection: Connection = defaultConnection) {}
  request(accessToken: string, signal: AbortSignal): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      if (this.connection.provider === 'github-enterprise' && this.connection.requiresReload) {
        reject(new SafeError('configurationChanged', getStrings('en').errorConfigurationChanged)); return;
      }
      const endpoint = quotaEndpoint(this.connection);
      if (!endpoint) { reject(new SafeError('configuration', getStrings('en').errorConfiguration)); return; }
      // VS Code patches Node HTTPS to apply its proxy and certificate support. Do not supply a custom agent.
      const request = this.requestFactory(endpoint, {
        method: 'GET', signal,
        headers: {
          Authorization: `Bearer ${accessToken}`, Accept: 'application/json',
          'User-Agent': `Copilot-Pace/${__EXTENSION_VERSION__}`, 'Editor-Version': `vscode/${this.editorVersion}`,
          'Editor-Plugin-Version': `copilot-pace/${__EXTENSION_VERSION__}`,
        },
      }, response => {
        const status = response.statusCode ?? 0;
        const chunks: Buffer[] = [];
        let size = 0;
        response.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > 1_048_576) request.destroy(new SafeError('invalidResponse', 'The response exceeds the expected size.'));
          else chunks.push(chunk);
        });
        response.on('error', () => reject(new SafeError('network', 'Could not finish reading the GitHub response.')));
        response.on('end', () => {
          const headers: HttpResponse['headers'] = {};
          for (const key of ['retry-after', 'x-ratelimit-reset', 'x-ratelimit-remaining']) {
            const header = response.headers[key];
            headers[key] = Array.isArray(header) ? header[0] : header;
          }
          let body: unknown;
          if (status >= 200 && status < 300) {
            try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown; }
            catch { reject(new SafeError('invalidResponse', 'GitHub returned an unsupported response.')); return; }
          }
          resolve({ status, headers, body });
        });
      });
      const timeout = setTimeout(() => request.destroy(new SafeError('timeout', 'The GitHub request timed out after 10 seconds.')), this.timeoutMs);
      timeout.unref();
      request.on('close', () => clearTimeout(timeout));
      request.on('error', error => reject(signal.aborted
        ? new SafeError('cancelled', 'Request cancelled.')
        : error instanceof SafeError ? error : new SafeError('network', 'Could not connect. Check your network, proxy and VS Code certificates.')));
      request.end();
    });
  }
}

function validTimestamp(value: number): number | undefined {
  return Number.isFinite(new Date(value).getTime()) ? value : undefined;
}

export function responseError(response: HttpResponse, now: number): SafeError | undefined {
  const { status, headers } = response;
  if (status >= 200 && status < 300) return;
  if (status === 401) return new SafeError('unauthorized', 'This session cannot read your quota. Reconnect to GitHub.');
  const rateLimited = status === 429 || (status === 403 && (headers['x-ratelimit-remaining'] === '0' || headers['retry-after'] !== undefined));
  if (rateLimited) {
    const retry = headers['retry-after'];
    const seconds = retry !== undefined && /^\d+(\.\d+)?$/.test(retry) ? Number(retry) : undefined;
    const retryTime = seconds !== undefined ? now + seconds * 1000 : retry !== undefined ? Date.parse(retry) : NaN;
    const reset = Number(headers['x-ratelimit-reset']) * 1000;
    // Invalid or overflowing headers must not reach the UI's date formatter.
    const retryAt = Math.max(now + 1000, validTimestamp(retryTime) ?? validTimestamp(reset) ?? now + 60_000);
    return new SafeError('rateLimited', 'GitHub has limited requests. Usage will refresh after the waiting period.', retryAt);
  }
  if (status === 403) return new SafeError('forbidden', 'GitHub does not allow this session to read the quota.');
  return new SafeError('server', `Usage is currently unavailable (HTTP ${status}).`);
}
