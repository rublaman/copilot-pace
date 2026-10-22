import { UTC_DAY, type DailyUsage } from './daily';
import type { Clock, Snapshot } from './domain';
import { responseError, type ApiTransport, type Session } from './transport';

const HOUR = 3_600_000;
const DISCOVERY = 'query PaceBillingAccounts { viewer { databaseId enterprises(first:20) { nodes { slug } pageInfo { hasNextPage } } organizations(first:20) { nodes { login } pageInfo { hasNextPage } } } }';
type Target = { kind: 'user' | 'organization' | 'enterprise'; name: string };
interface CachedDay { item: DailyUsage; checkedAt: number }
export interface DailyUsageProvider {
  readonly nextAllowedAt: number;
  read(session: Session, snapshot: Snapshot, quota: unknown, signal: AbortSignal): Promise<DailyUsage[]>;
  reset(): void;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function login(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9](?:[a-z0-9_-]{0,98}[a-z0-9])?$/i.test(value);
}
function names(value: unknown, key: string): string[] | undefined {
  const connection = record(value);
  if (record(connection.pageInfo).hasNextPage !== false || !Array.isArray(connection.nodes)) return;
  const entries = connection.nodes.map(item => record(item)[key]);
  if (entries.length > 20 || !entries.every(login)) return;
  return [...new Set(entries.map(item => item.toLowerCase()))];
}

// Billing quantities include covered credits. netQuantity alone would hide included-plan consumption.
export function creditReport(body: unknown, target: Target, at: number, username: string, daily: boolean): { used: number; hasCredits: boolean } | undefined {
  const root = record(body);
  const account = root[target.kind];
  const period = record(root.timePeriod);
  const date = new Date(at);
  if (typeof account !== 'string' || account.toLowerCase() !== target.name.toLowerCase() ||
      period.year !== date.getUTCFullYear() || period.month !== date.getUTCMonth() + 1 ||
      (daily && period.day !== date.getUTCDate()) || !Array.isArray(root.usageItems) || root.usageItems.length > 10_000) return;
  let used = 0;
  let hasCredits = false;
  for (const value of root.usageItems) {
    const item = record(value);
    if (typeof item.product !== 'string') return;
    if (!/^copilot(?: ai credits)?$/i.test(item.product)) continue;
    if (!['credits', 'ai-credits'].includes(String(item.unitType)) ||
        typeof item.grossQuantity !== 'number' || !Number.isFinite(item.grossQuantity) || item.grossQuantity < 0 ||
        (item.user !== undefined && (typeof item.user !== 'string' || item.user.toLowerCase() !== username.toLowerCase()))) return;
    used += item.grossQuantity;
    hasCredits = true;
  }
  if (!Number.isFinite(used) || (root.usageItems.length > 0 && !hasCredits)) return;
  return { used, hasCredits };
}

export class BillingUsage implements DailyUsageProvider {
  private identity = '';
  private days = new Map<number, CachedDay>();
  private payer = '';
  private attemptAt = 0;
  private rateLimitAt = 0;
  constructor(private readonly transport: ApiTransport, private readonly clock: Clock) {}
  get nextAllowedAt() { return this.rateLimitAt; }
  reset() {
    this.identity = '';
    this.days = new Map();
    this.payer = '';
    this.attemptAt = 0;
    this.rateLimitAt = 0;
  }
  async read(session: Session, snapshot: Snapshot, quota: unknown, signal: AbortSignal): Promise<DailyUsage[]> {
    if (snapshot.kind === 'unavailable' || !snapshot.cycle || signal.aborted) return [];
    const now = this.clock.now().getTime();
    const cycle = snapshot.cycle;
    if (cycle.end - cycle.start > 32 * UTC_DAY || now < cycle.start || now >= cycle.end) return [];
    const identity = JSON.stringify([session.id, session.account.id, cycle.start, cycle.end]);
    if (identity !== this.identity) {
      this.reset();
      this.identity = identity;
    }
    const cache = this.days;
    const today = Math.floor(now / UTC_DAY) * UTC_DAY;
    const result = () => [...cache.values()]
      .filter(value => now - value.checkedAt < (value.item.day >= today - UTC_DAY ? HOUR : 24 * HOUR))
      .map(value => value.item).sort((a, b) => a.day - b.day);
    if (now < Math.max(this.attemptAt, this.rateLimitAt)) return result();
    this.attemptAt = now + HOUR;
    const boundedSignal = AbortSignal.any([signal, AbortSignal.timeout(30_000)]);
    const active = () => !boundedSignal.aborted && this.identity === identity && this.days === cache;
    let requests = 0;
    const call = async (path: string, query?: string) => {
      if (!active() || ++requests > 40) throw new Error('Billing read cancelled');
      const response = await this.transport.api(path, session.accessToken, boundedSignal, query);
      if (!active()) throw new Error('Billing read cancelled');
      const failure = responseError(response, this.clock.now().getTime());
      if (failure?.code === 'rateLimited') {
        this.rateLimitAt = failure.retryAt!;
        throw failure;
      }
      if (response.status === 401) throw new Error('Billing authorization unavailable');
      if (response.status >= 500 || (response.status >= 300 && ![403, 404].includes(response.status))) throw new Error('Billing unavailable');
      return response.status === 200 ? response.body : undefined;
    };
    try {
      // Resolve the authenticated login; the display label can include an Enterprise host or a real name.
      const user = record(await call('/user'));
      if (!login(user.login) || String(user.id) !== session.account.id) return result();
      const username = user.login;
      const report = async (target: Target, day?: number) => {
        const date = new Date(day ?? cycle.start);
        const scope = { user: 'users', organization: 'organizations', enterprise: 'enterprises' }[target.kind];
        const parameters = new URLSearchParams({ year: String(date.getUTCFullYear()), month: String(date.getUTCMonth() + 1) });
        if (day !== undefined) parameters.set('day', String(date.getUTCDate()));
        if (target.kind !== 'user') parameters.set('user', username);
        const body = await call(`/${scope}/${encodeURIComponent(target.name)}/settings/billing/ai_credit/usage?${parameters}`);
        if (day !== undefined && body === undefined) throw new Error('Daily billing unavailable');
        return creditReport(body, target, day ?? cycle.start, username, day !== undefined);
      };
      const root = record(quota);
      const managed = root.copilot_plan === 'business' || root.copilot_plan === 'enterprise';
      let target: Target | undefined;
      if (!managed) {
        const personal: Target = { kind: 'user', name: username };
        if ((await report(personal))?.hasCredits) target = personal;
      }
      let organizations: string[] | undefined;
      if (Array.isArray(root.organization_login_list) && root.organization_login_list.length <= 20 && root.organization_login_list.every(login)) {
        organizations = [...new Set(root.organization_login_list.map(value => value.toLowerCase()))];
      }
      let triedOrganization = false;
      if (!target && organizations?.length === 1) {
        const organization: Target = { kind: 'organization', name: organizations[0]! };
        triedOrganization = true;
        if ((await report(organization))?.hasCredits) target = organization;
      }
      if (!target) {
        const data = record(record(await call('/graphql', DISCOVERY)).data);
        const viewer = record(data.viewer);
        const matches = String(viewer.databaseId) === session.account.id;
        const enterprises = matches ? names(viewer.enterprises, 'slug') : undefined;
        if (root.organization_login_list === undefined && matches) organizations = names(viewer.organizations, 'login');
        // Multiple payers can overlap or omit usage. Keep the observed fallback when routing is ambiguous.
        if (enterprises?.length === 1) {
          const enterprise: Target = { kind: 'enterprise', name: enterprises[0]! };
          if ((await report(enterprise))?.hasCredits) target = enterprise;
        }
        if (!target && !triedOrganization && organizations?.length === 1) {
          const organization: Target = { kind: 'organization', name: organizations[0]! };
          if ((await report(organization))?.hasCredits) target = organization;
        }
      }
      if (!target) {
        this.attemptAt = now + 24 * HOUR;
        return result();
      }
      const payer = `${target.kind}:${target.name.toLowerCase()}`;
      if (payer !== this.payer) {
        cache.clear();
        this.payer = payer;
      }
      for (let day = today; day >= cycle.start; day -= UTC_DAY) {
        const saved = cache.get(day);
        const ttl = day >= today - UTC_DAY ? HOUR : 24 * HOUR;
        if (saved && now - saved.checkedAt < ttl) continue;
        const daily = await report(target, day);
        if (daily && active()) cache.set(day, { item: { day, used: daily.used, partial: day === today }, checkedAt: now });
      }
    } catch {
      // Supplemental billing must never break quota, trigger reconnection or expose response bodies.
    }
    return active() ? result() : [];
  }
}
