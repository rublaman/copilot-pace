import * as assert from 'node:assert/strict';
import { quotaEndpoint, resolveConnection } from '../../src/connection';

describe('Account service and quota destination', () => {
  for (const provider of [undefined, 'auto', 'github']) {
    it(`keeps GitHub.com for personal and Business accounts (${provider ?? 'unset'})`, () => {
      const connection = resolveConnection({ provider, enterpriseUri: 'https://unrelated.example.com' });
      assert.equal(connection.provider, 'github');
      assert.equal(quotaEndpoint(connection), 'https://api.github.com/copilot_internal/user');
    });
  }
  it('follows Copilot Enterprise unless Pace explicitly chooses GitHub.com', () => {
    const settings = { copilotProvider: 'github-enterprise', enterpriseUri: 'https://octocat.ghe.com' };
    assert.equal(resolveConnection(settings).provider, 'github-enterprise');
    assert.equal(resolveConnection({ ...settings, provider: 'github' }).provider, 'github');
    assert.equal(quotaEndpoint(resolveConnection({ ...settings, provider: 'github' })), 'https://api.github.com/copilot_internal/user');
  });
  for (const origin of ['https://octocat.ghe.com', 'https://git.corporate.example']) {
    it(`pairs an explicitly configured enterprise instance with its Copilot API (${origin})`, () => {
      assert.equal(quotaEndpoint(resolveConnection({ provider: 'github-enterprise', enterpriseUri: origin })),
        `https://api.${new URL(origin).hostname}/copilot_internal/user`);
    });
  }
  for (const enterpriseUri of [undefined, '', 'http://git.example.com', 'https://git.example.com/project/repo',
    'https://git.example.com/login', 'https://user:secret@git.example.com', 'https://git.example.com?token=secret',
    'https://git.example.com#secret', 'https://github.com', 'https://api.github.com', 'https://www.github.com',
    'https://github.com.attacker.example/../login', 'https://127.0.0.1', 'https://localhost',
    'https://git.example.com:8443', 'https://git.example.com.', 'https://git.example.com\\login', 'https://bad..example.com']) {
    it(`does not send credentials for invalid or missing enterprise configuration (${enterpriseUri ?? 'missing'})`, () => {
      const connection = resolveConnection({ provider: 'github-enterprise', enterpriseUri });
      assert.equal(quotaEndpoint(connection), undefined);
      assert.ok(!connection.key.includes('secret'));
      // Unrelated enterprise settings must not break GitHub.com accounts.
      assert.equal(quotaEndpoint(resolveConnection({ provider: 'github', enterpriseUri })), 'https://api.github.com/copilot_internal/user');
    });
  }
  it('respects explicit plural settings, including an empty list, over the legacy URI', () => {
    const settings = { provider: 'github-enterprise', enterpriseUri: 'https://legacy.example.com' };
    assert.equal(quotaEndpoint(resolveConnection({ ...settings, enterpriseUris: [] })), undefined);
    assert.equal(quotaEndpoint(resolveConnection({ ...settings, enterpriseUris: ['https://new.ghe.com'] })),
      'https://api.new.ghe.com/copilot_internal/user');
    assert.equal(quotaEndpoint(resolveConnection({ ...settings, enterpriseUris: 'not-an-array' })), undefined);
  });
  it('normalizes equivalent origins but refuses to guess between distinct instances', () => {
    const one = resolveConnection({ provider: 'github-enterprise', enterpriseUris: ['https://CORP.ghe.com:443/', 'https://corp.ghe.com'] });
    assert.equal(one.origins.length, 1);
    assert.equal(quotaEndpoint(one), 'https://api.corp.ghe.com/copilot_internal/user');
    const two = resolveConnection({ provider: 'github-enterprise', enterpriseUris: ['https://one.ghe.com', 'https://two.ghe.com'] });
    assert.equal(quotaEndpoint(two), undefined);
    assert.notEqual(one.key, two.key);
  });
});
