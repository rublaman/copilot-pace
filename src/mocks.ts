import { systemClock, type Clock } from './domain';
import { SafeError, type HttpResponse, type HttpTransport, type SessionProvider } from './transport';

export const scenarioLabels = {
  '10000-comfortable': '10,000 credits · 40% used',
  '10000-one-credit': '10,000 credits · 1 used (<0.1%)',
  '10000-two-credits': '10,000 credits · 2 used (<0.1%)',
  '3900-on-track': '3,900 credits · 45% used',
  '3900-over-pace': '3,900 credits · 60% used',
  'budget-3900': 'Before: 1,950 used / 3,900',
  'budget-10000': 'After: 1,950 used / 10,000',
  exhausted: 'Budget exhausted',
  'usage-only': 'Usage without a known budget',
  incomplete: 'Incomplete response',
  disconnected: 'Not signed in',
  timeout: 'Request timed out',
  '401': 'HTTP 401 · Session unauthorized',
  '403': 'HTTP 403 · Access denied',
  '429': 'HTTP 429 · Rate limited',
  '500': 'HTTP 500 · Server error',
} as const;
export type MockScenario = keyof typeof scenarioLabels;
export function isScenario(value: string): value is MockScenario { return Object.hasOwn(scenarioLabels, value); }
// Preserve 0.1.0 settings when upgrading to the English-only interface.
const legacyScenarios: Record<string, MockScenario> = {
  '10000-de-sobra': '10000-comfortable', '3900-justo': '3900-on-track', '3900-pasado': '3900-over-pace',
  'presupuesto-3900': 'budget-3900', 'presupuesto-10000': 'budget-10000', agotada: 'exhausted',
  'sin-limite': 'usage-only', incompleta: 'incomplete', desconexion: 'disconnected',
};
export function resolveScenario(value: string): MockScenario {
  return isScenario(value) ? value : Object.hasOwn(legacyScenarios, value) ? legacyScenarios[value]! : '10000-comfortable';
}

// Synthetic responses, not captured corporate traffic. Source contract: VS Code chatEntitlementService.ts.
export function boundedFixture(total: number, used: number, now: Date): unknown {
  const renewal = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {
    token_based_billing: true,
    quota_reset_date_utc: renewal.toISOString(),
    quota_snapshots: {
      chat: { unlimited: true, percent_remaining: 100 },
      premium_interactions: {
        unlimited: false, entitlement: total, quota_remaining: total - used,
        percent_remaining: 100 - used / total * 100, has_quota: false,
        quota_reset_at: renewal.getTime() / 1000,
      },
    },
  };
}
export class MockSessions implements SessionProvider {
  constructor(private readonly scenario: MockScenario) {}
  async get() { return this.scenario === 'disconnected' ? undefined : { id: 'synthetic-session', accessToken: 'synthetic-not-a-credential' }; }
}
export class MockTransport implements HttpTransport {
  constructor(private readonly scenario: MockScenario, private readonly clock: Clock = systemClock) {}
  async request(_accessToken: string, signal: AbortSignal): Promise<HttpResponse> {
    if (signal.aborted) throw new SafeError('cancelled', 'Request cancelled.');
    if (this.scenario === 'timeout') throw new SafeError('timeout', 'Request timed out (simulated).');
    if (/^\d{3}$/.test(this.scenario)) return { status: Number(this.scenario), headers: this.scenario === '429' ? { 'retry-after': '60' } : {}, body: undefined };
    const amounts: Partial<Record<MockScenario, [number, number]>> = {
      '10000-comfortable': [10000, 4000], '10000-one-credit': [10000, 1], '10000-two-credits': [10000, 2],
      '3900-on-track': [3900, 1755], '3900-over-pace': [3900, 2340],
      'budget-3900': [3900, 1950], 'budget-10000': [10000, 1950], exhausted: [3900, 3900],
    };
    const amount = amounts[this.scenario];
    const body = amount ? boundedFixture(...amount, this.clock.now()) : this.scenario === 'usage-only' ? {
      token_based_billing: true, quota_snapshots: { premium_interactions: { unlimited: true, credits_used: 1950 } },
    } : { token_based_billing: true, quota_snapshots: {} };
    return { status: 200, headers: {}, body };
  }
}
