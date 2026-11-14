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
  it('pairs a hosted Enterprise instance with its Copilot API', () => {
    const connection = resolveConnection({ provider: 'github-enterprise', enterpriseUri: 'https://octocat.ghe.com' });
    assert.equal(quotaEndpoint(connection), 'https://api.octocat.ghe.com/copilot_internal/user');
  });
  for (const enterpriseUri of [undefined, '', 'https://git.corporate.example', 'http://corp.ghe.com',
    'https://corp.ghe.com/project/repo', 'https://corp.ghe.com/login', 'https://user:secret@corp.ghe.com',
    'https://corp.ghe.com?token=secret', 'https://corp.ghe.com#secret', 'https://github.com', 'https://api.github.com', 'https://www.github.com',
    'https://github.com.attacker.example/../login', 'https://127.0.0.1', 'https://localhost',
    'https://corp.ghe.com:443', 'https://corp.ghe.com:8443', 'https://corp.ghe.com.', 'https://corp.ghe.com\\login',
    'https://bad..ghe.com', 'https://ghe.com', 'https://api.corp.ghe.com', 'https://corp.ghe.com.example', 'https://corp.GHE.COM']) {
    it(`does not send credentials for invalid or missing enterprise configuration (${enterpriseUri ?? 'missing'})`, () => {
      const connection = resolveConnection({ provider: 'github-enterprise', enterpriseUri });
      assert.equal(quotaEndpoint(connection), undefined);
      assert.ok(!connection.key.includes('secret'));
      // Unrelated enterprise settings must not break GitHub.com accounts.
      assert.equal(quotaEndpoint(resolveConnection({ provider: 'github', enterpriseUri })), 'https://api.github.com/copilot_internal/user');
    });
  }
  it('respects explicit plural settings, including an empty list, over the legacy URI', () => {
    const settings = { provider: 'github-enterprise', enterpriseUri: 'https://legacy.ghe.com' };
    assert.equal(quotaEndpoint(resolveConnection({ ...settings, enterpriseUris: [] })), undefined);
    assert.equal(quotaEndpoint(resolveConnection({ ...settings, enterpriseUris: ['https://new.ghe.com'] })),
      'https://api.new.ghe.com/copilot_internal/user');
    assert.equal(quotaEndpoint(resolveConnection({ ...settings, enterpriseUris: 'not-an-array' })), undefined);
  });
  it('normalizes equivalent origins but refuses to guess between distinct instances', () => {
    const one = resolveConnection({ provider: 'github-enterprise', enterpriseUris: ['https://CORP.ghe.com/', 'https://corp.ghe.com'] });
    assert.equal(one.origins.length, 1);
    assert.equal(quotaEndpoint(one), 'https://api.corp.ghe.com/copilot_internal/user');
    const two = resolveConnection({ provider: 'github-enterprise', enterpriseUris: ['https://one.ghe.com', 'https://two.ghe.com'] });
    assert.equal(quotaEndpoint(two), undefined);
    assert.notEqual(one.key, two.key);
  });
});
