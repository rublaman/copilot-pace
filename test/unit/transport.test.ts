import * as assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { RequestOptions } from 'node:https';
import { GitHubTransport, responseError, SafeError } from '../../src/transport';
import { createViewModel } from '../../src/view';
import { resolveConnection } from '../../src/connection';

function engine(status: number, body: string, options: { pending?: boolean; failure?: Error; oversize?: boolean } = {}) {
  let capturedUrl = ''; let capturedOptions: RequestOptions = {};
  const factory = (url: string, requestOptions: RequestOptions, callback: (response: IncomingMessage) => void): ClientRequest => {
    capturedUrl = url; capturedOptions = requestOptions;
    const request = new EventEmitter() as EventEmitter & { end(): void; destroy(error?: Error): void };
    request.destroy = error => { if (error) request.emit('error', error); request.emit('close'); };
    requestOptions.signal?.addEventListener('abort', () => request.destroy(new Error('Aborted')), { once: true });
    request.end = () => queueMicrotask(() => {
      if (options.failure) { request.destroy(options.failure); return; }
      if (options.pending) return;
      const response = new EventEmitter() as IncomingMessage;
      response.statusCode = status; response.headers = {};
      callback(response);
      response.emit('data', options.oversize ? Buffer.alloc(1_048_577) : Buffer.from(body));
      response.emit('end'); request.emit('close');
    });
    return request as unknown as ClientRequest;
  };
  return { factory, inspect: () => ({ url: capturedUrl, options: capturedOptions }) };
}
describe('Real HTTP adapter with a simulated network engine', () => {
  it('sends an enterprise credential only to the corresponding quota host with normal TLS integration', async () => {
    const fake = engine(200, '{}');
    const connection = resolveConnection({ provider: 'github-enterprise', enterpriseUri: 'https://corp.ghe.com' });
    await new GitHubTransport('1.141.0', 10000, fake.factory, connection).request('enterprise-synthetic', new AbortController().signal);
    assert.equal(fake.inspect().url, 'https://api.corp.ghe.com/copilot_internal/user');
    assert.equal((fake.inspect().options.headers as Record<string, string>).Authorization, 'Bearer enterprise-synthetic');
    assert.equal(fake.inspect().options.agent, undefined);
    assert.equal(fake.inspect().options.rejectUnauthorized, undefined);
  });
  it('does not follow redirects or resend credentials to GitHub.com', async () => {
    const fake = engine(302, '');
    const connection = resolveConnection({ provider: 'github-enterprise', enterpriseUri: 'https://corp.ghe.com' });
    const response = await new GitHubTransport('1.141.0', 10000, fake.factory, connection).request('synthetic', new AbortController().signal);
    assert.equal(response.status, 302);
    assert.equal(fake.inspect().url, 'https://api.corp.ghe.com/copilot_internal/user');
  });
  it('does not invoke the HTTP engine when an enterprise quota destination is ambiguous', async () => {
    const fake = engine(200, '{}');
    const connection = resolveConnection({ provider: 'github-enterprise', enterpriseUris: ['https://one.ghe.com', 'https://two.ghe.com'] });
    await assert.rejects(new GitHubTransport('1.141.0', 10000, fake.factory, connection).request('synthetic', new AbortController().signal), { code: 'configuration' });
    assert.equal(fake.inspect().url, '');
  });
  it('requests only the quota endpoint with authorization and the host TLS integration', async () => {
    const fake = engine(200, '{"token_based_billing":true}');
    const response = await new GitHubTransport('1.141.0', 10000, fake.factory).request('test-secret', new AbortController().signal);
    assert.equal(fake.inspect().url, 'https://api.github.com/copilot_internal/user');
    assert.equal(fake.inspect().options.method, 'GET');
    assert.equal((fake.inspect().options.headers as Record<string, string>).Authorization, 'Bearer test-secret');
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
    const headers = fake.inspect().options.headers as Record<string, string>;
    assert.equal(headers['User-Agent'], `Copilot-Pace/${version}`);
    assert.equal(headers['Editor-Plugin-Version'], `copilot-pace/${version}`);
    assert.equal(fake.inspect().options.agent, undefined); assert.equal(fake.inspect().options.rejectUnauthorized, undefined);
    assert.deepEqual(response.body, { token_based_billing: true });
  });
  it('does not require JSON in HTTP error responses', async () => {
    const fake = engine(500, '<html>Server error</html>');
    const response = await new GitHubTransport('1.141.0', 10000, fake.factory).request('synthetic', new AbortController().signal);
    assert.equal(response.status, 500); assert.equal(response.body, undefined);
  });
  it('rejects invalid JSON without exposing its content', async () => {
    const fake = engine(200, 'secret-data');
    await assert.rejects(new GitHubTransport('1.141.0', 10000, fake.factory).request('synthetic', new AbortController().signal), error => error instanceof SafeError && error.code === 'invalidResponse' && !error.message.includes('secret-data'));
  });
  it('limits response size', async () => {
    const fake = engine(200, '{}', { oversize: true });
    await assert.rejects(new GitHubTransport('1.141.0', 10000, fake.factory).request('synthetic', new AbortController().signal), error => error instanceof SafeError && error.code === 'invalidResponse');
  });
  it('enforces a total timeout even before receiving a response', async () => {
    const fake = engine(200, '{}', { pending: true });
    await assert.rejects(new GitHubTransport('1.141.0', 5, fake.factory).request('synthetic', new AbortController().signal), error => error instanceof SafeError && error.code === 'timeout');
  });
  it('cancels when changing session or source', async () => {
    const fake = engine(200, '{}', { pending: true });
    const abort = new AbortController();
    const pending = new GitHubTransport('1.141.0', 10000, fake.factory).request('synthetic', abort.signal);
    abort.abort(); await assert.rejects(pending, error => error instanceof SafeError && error.code === 'cancelled');
  });
  it('sanitizes certificate and network errors', async () => {
    const fake = engine(200, '{}', { failure: new Error('certificate problem secret-token') });
    await assert.rejects(new GitHubTransport('1.141.0', 10000, fake.factory).request('synthetic', new AbortController().signal), error => error instanceof SafeError && error.code === 'network' && !error.message.includes('secret-token'));
  });
});

describe('Rate limit headers', () => {
  const now = Date.parse('2026-10-16T00:00:00Z');
  for (const [name, headers] of [
    ['Retry-After outside the date range', { 'retry-after': '99999999999999' }],
    ['Retry-After overflowing to infinity', { 'retry-after': '9'.repeat(400) }],
    ['rate limit reset outside the date range', { 'x-ratelimit-reset': '99999999999999' }],
    ['invalid headers', { 'retry-after': 'invalid', 'x-ratelimit-reset': 'Infinity' }],
  ] as const) {
    it(`falls back safely for ${name}`, () => {
      const failure = responseError({ status: 429, headers, body: undefined }, now);
      assert.equal(failure?.retryAt, now + 60_000);
      assert.doesNotThrow(() => createViewModel({ phase: 'error', failure }, { now: () => new Date(now) }, 'all', false, '', failure!.retryAt!));
    });
  }
  it('uses a valid rate limit reset when Retry-After overflows', () => {
    const failure = responseError({ status: 429, headers: { 'retry-after': '9'.repeat(400), 'x-ratelimit-reset': String(now / 1000 + 120) }, body: undefined }, now);
    assert.equal(failure?.retryAt, now + 120_000);
  });
});
