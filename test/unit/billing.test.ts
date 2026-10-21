import * as assert from 'node:assert/strict';
import { BillingUsage, creditReport } from '../../src/billing';
import { mergeDailyUsage, observedDailyUsage, UTC_DAY } from '../../src/daily';
import type { Snapshot } from '../../src/domain';
import type { ApiTransport, HttpResponse, Session } from '../../src/transport';

const start = Date.parse('2026-10-01T00:00Z');
const end = Date.parse('2026-11-01T00:00Z');
const now = start + 2.5 * UTC_DAY;
const session: Session = { id: 'session', account: { id: '42', label: 'A display name (corp.ghe.com)' }, accessToken: 'synthetic' };
const snapshot: Snapshot = { kind: 'bounded', used: 500, total: 1000, usedPercent: 50, cycle: { start, end }, asOf: now };
const ok = (body: unknown): HttpResponse => ({ status: 200, headers: {}, body });
function report(kind: string, name: string, day?: number, used = 50) {
  return {
    [kind]: name, timePeriod: { year: 2026, month: 10, ...(day ? { day } : {}) },
    usageItems: [{ product: 'Copilot', unitType: 'credits', grossQuantity: used, netQuantity: 0, discountQuantity: used }],
  };
}
function setup(options: { scope?: 'user' | 'organization' | 'enterprise'; deny?: number; limit?: boolean; failDay?: number } = {}) {
  const requests: Array<{ path: string; token: string; query?: string }> = [];
  let time = now;
  const scope = options.scope ?? 'user';
  const transport: ApiTransport = {
    api: async (path, token, _signal, query) => {
      requests.push({ path, token, query });
      if (path === '/user') return ok({ login: 'octocat', id: 42 });
      if (path === '/graphql') return ok({ data: { viewer: {
        databaseId: 42,
        enterprises: { nodes: scope === 'enterprise' ? [{ slug: 'company' }] : [], pageInfo: { hasNextPage: false } },
        organizations: { nodes: [{ login: 'team' }], pageInfo: { hasNextPage: false } },
      } } });
      if (options.limit) return { status: 429, headers: { 'retry-after': '7200' }, body: undefined };
      if (options.deny) return { status: options.deny, headers: {}, body: undefined };
      const url = new URL(path, 'https://api.github.com');
      const day = Number(url.searchParams.get('day')) || undefined;
      if (options.failDay !== undefined && day === options.failDay) return ok({ invalid: true });
      const prefix = { user: '/users/octocat/', organization: '/organizations/team/', enterprise: '/enterprises/company/' }[scope];
      return path.startsWith(prefix) ? ok(report(scope, { user: 'octocat', organization: 'team', enterprise: 'company' }[scope], day))
        : { status: 403, headers: {}, body: undefined };
    },
  };
  const billing = new BillingUsage(transport, { now: () => new Date(time) });
  return { billing, transport, requests, advance: (duration: number) => { time += duration; } };
}

describe('Optional daily billing usage', () => {
  for (const scope of ['user', 'organization', 'enterprise'] as const) {
    it(`retrieves ${scope} daily credits for the authenticated user with no new authentication`, async () => {
      const { billing, requests } = setup({ scope });
      const quota = scope === 'user' ? { copilot_plan: 'individual_pro' } : { copilot_plan: scope === 'organization' ? 'business' : 'enterprise', organization_login_list: ['team'] };
      const days = await billing.read(session, snapshot, quota, new AbortController().signal);
      assert.deepEqual(days, [
        { day: start, used: 50, partial: false },
        { day: start + UTC_DAY, used: 50, partial: false },
        { day: start + 2 * UTC_DAY, used: 50, partial: true },
      ]);
      assert.ok(requests.every(request => request.token === 'synthetic'));
      const daily = requests.filter(request => request.path.includes('&day='));
      assert.equal(daily.length, 3);
      assert.ok(daily.every(request => scope === 'user' || request.path.includes('&user=octocat')));
      assert.equal(requests.some(request => request.path.startsWith('/users/')), scope === 'user');
    });
  }
  for (const status of [401, 403, 404, 500]) {
    it(`quietly falls back on HTTP ${status} and limits repeated attempts`, async () => {
      const { billing, requests } = setup({ deny: status });
      assert.deepEqual(await billing.read(session, snapshot, {}, new AbortController().signal), []);
      const count = requests.length;
      assert.deepEqual(await billing.read(session, snapshot, {}, new AbortController().signal), []);
      assert.equal(requests.length, count);
    });
  }
  it('honors Retry-After without trying another billing route', async () => {
    const { billing, requests } = setup({ limit: true });
    assert.deepEqual(await billing.read(session, snapshot, {}, new AbortController().signal), []);
    assert.equal(billing.nextAllowedAt, now + 7200000);
    assert.equal(requests.length, 2);
  });
  it('keeps missing report days unknown while retaining other daily totals', async () => {
    const { billing } = setup({ failDay: 2 });
    const days = await billing.read(session, snapshot, {}, new AbortController().signal);
    assert.deepEqual(days.map(item => item.day), [start, start + 2 * UTC_DAY]);
  });
  it('caches reports and refreshes the current and preceding UTC days after one hour', async () => {
    const { billing, requests, advance } = setup();
    const signal = new AbortController().signal;
    await billing.read(session, snapshot, {}, signal);
    const count = requests.length;
    await billing.read(session, snapshot, {}, signal);
    assert.equal(requests.length, count);
    advance(3600000);
    await billing.read(session, snapshot, {}, signal);
    const newDays = requests.slice(count).filter(request => request.path.includes('&day='));
    assert.equal(newDays.length, 2);
  });
  it('rejects mismatched account identities before requesting billing', async () => {
    const { billing, requests } = setup();
    assert.deepEqual(await billing.read({ ...session, account: { id: 'other', label: 'octocat' } }, snapshot, {}, new AbortController().signal), []);
    assert.equal(requests.length, 1);
  });
  it('never guesses a payer when discovery is ambiguous or truncated', async () => {
    const { billing, transport, requests } = setup();
    const original = transport.api;
    transport.api = async (path, token, signal, query) => path === '/graphql' ? ok({ data: { viewer: {
      databaseId: 42,
      enterprises: { nodes: [{ slug: 'one' }], pageInfo: { hasNextPage: true } },
      organizations: { nodes: [{ login: 'one' }, { login: 'two' }], pageInfo: { hasNextPage: false } },
    } } }) : path.startsWith('/users/') ? { status: 403, headers: {}, body: undefined } : original(path, token, signal, query);
    assert.deepEqual(await billing.read(session, snapshot, {}, new AbortController().signal), []);
    assert.ok(!requests.some(request => request.path.startsWith('/organizations/') || request.path.startsWith('/enterprises/')));
  });
  it('still attempts the assigned Business organization when Enterprise discovery is forbidden', async () => {
    const { billing, transport } = setup({ scope: 'organization' });
    const original = transport.api;
    transport.api = async (path, token, signal, query) => path === '/graphql' ? { status: 403, headers: {}, body: undefined } : original(path, token, signal, query);
    assert.equal((await billing.read(session, snapshot, { copilot_plan: 'business', organization_login_list: ['team'] }, new AbortController().signal)).length, 3);
  });
  it('discards an uncooperative late response after abort and reset', async () => {
    const { billing, transport } = setup();
    let complete!: (value: HttpResponse) => void;
    transport.api = async () => new Promise(resolve => { complete = resolve; });
    const controller = new AbortController();
    const pending = billing.read(session, snapshot, {}, controller.signal);
    controller.abort();
    billing.reset();
    complete(ok({ login: 'octocat', id: 42 }));
    assert.deepEqual(await pending, []);
    assert.equal(billing.nextAllowedAt, 0);
  });
  it('does not request billing for legacy quotas, unknown cycles or an already cancelled read', async () => {
    const { billing, requests } = setup();
    const cancelled = new AbortController();
    cancelled.abort();
    await billing.read(session, { kind: 'unavailable', asOf: now, reason: 'Unsupported' }, {}, new AbortController().signal);
    await billing.read(session, { ...snapshot, cycle: undefined }, {}, new AbortController().signal);
    await billing.read(session, snapshot, {}, cancelled.signal);
    assert.equal(requests.length, 0);
  });
});

describe('Daily credit report validation', () => {
  const target = { kind: 'user' as const, name: 'octocat' };
  it('counts gross credit consumption across models, including credits covered by the plan', () => {
    const body = report('user', 'octocat', 1, 50);
    body.usageItems.push({ product: 'Copilot', unitType: 'ai-credits', grossQuantity: 12.5, netQuantity: 0, discountQuantity: 12.5 });
    assert.deepEqual(creditReport(body, target, start, 'octocat', true), { used: 62.5, hasCredits: true });
  });
  for (const [name, change] of [
    ['legacy requests', { unitType: 'requests' }], ['negative credits', { grossQuantity: -1 }],
    ['non-numeric credits', { grossQuantity: '50' }], ['another user', { user: 'someone-else' }],
  ] as const) {
    it(`rejects ${name}`, () => {
      const body = report('user', 'octocat', 1);
      Object.assign(body.usageItems[0]!, change);
      assert.equal(creditReport(body, target, start, 'octocat', true), undefined);
    });
  }
  it('requires the requested payer and day rather than mistaking a monthly report for daily data', () => {
    assert.equal(creditReport(report('user', 'other', 1), target, start, 'octocat', true), undefined);
    assert.equal(creditReport(report('user', 'octocat'), target, start, 'octocat', true), undefined);
    assert.equal(creditReport(report('user', 'octocat', 2), target, start, 'octocat', true), undefined);
    const empty = { user: 'octocat', timePeriod: { year: 2026, month: 10, day: 1 }, usageItems: [] };
    assert.deepEqual(creditReport(empty, target, start, 'octocat', true), { used: 0, hasCredits: false });
  });
});

describe('Observed daily fallback', () => {
  it('counts only nearby same-day differences and leaves midnight, offline gaps, corrections and budget changes unattributed', () => {
    const at = start + 10 * 3600000;
    const items = [
      { at, used: 100 }, { at: at + 3600000, used: 120 }, { at: at + 7200000, used: 125 },
      { at: at + 10800000, used: 110 }, { at: at + 14400000, used: 130, total: 2000 },
      { at: at + 28800000, used: 180 }, { at: start + UTC_DAY + 3600000, used: 300 },
      { at: start + UTC_DAY + 7200000, used: 307 },
    ].map(item => ({ total: 1000, start, end, ...item }));
    assert.deepEqual(observedDailyUsage(items, { start, end }), [
      { day: start, used: 25, partial: true }, { day: start + UTC_DAY, used: 7, partial: true },
    ]);
  });
  it('does not invent daily zero values from a single observation or bridge different cycles', () => {
    const item = { at: start + 3600000, used: 100, start, end };
    assert.deepEqual(observedDailyUsage([item], { start, end }), []);
    assert.deepEqual(observedDailyUsage([item, { ...item, at: start + 7200000, used: 120, start: start - UTC_DAY }], { start, end }), []);
  });
  it('prefers reported totals per day and retains local fallback for missing days', () => {
    const local = [{ day: start, used: 5, partial: true }, { day: start + UTC_DAY, used: 7, partial: true }];
    assert.deepEqual(mergeDailyUsage(local, [{ day: start, used: 50, partial: false }]), [
      { day: start, used: 50, partial: false }, local[1],
    ]);
  });
});
