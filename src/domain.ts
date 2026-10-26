export type DayMode = 'all' | 'weekdays';
export interface Clock { now(): Date }
export const systemClock: Clock = { now: () => new Date() };
export interface Cycle { start: number; end: number }
interface BaseSnapshot { asOf: number; cycle?: Cycle }
export type Snapshot =
  | (BaseSnapshot & { kind: 'bounded'; used: number; total: number; usedPercent: number })
  | (BaseSnapshot & { kind: 'usageOnly'; used: number })
  | (BaseSnapshot & { kind: 'unavailable'; reason: 'unsupportedQuota' | 'missingQuota' });
export type Pace =
  | { kind: 'available'; dailyAverage: number; projected: number; projectedPercent: number; label: 'Comfortable' | 'On track' | 'Over pace' }
  | { kind: 'pending' | 'unavailable'; label: string };

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function number(value: unknown, allowNegative = false): number | undefined {
  if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) return;
  const parsed = Number(value);
  return Number.isFinite(parsed) && (allowNegative || parsed >= 0) ? parsed : undefined;
}
function billingCycle(reset: unknown, now: Date): Cycle | undefined {
  let end = NaN;
  if (typeof reset === 'number') end = reset * 1000;
  else if (typeof reset === 'string') end = Date.parse(reset);
  const date = new Date(end);
  // The supported credit cycle is the calendar month in UTC. Unknown cycles get no forecast.
  if (!Number.isFinite(end) || date.getUTCDate() !== 1 || date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || date.getUTCSeconds() !== 0) return;
  const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1);
  return now.getTime() >= start && now.getTime() < end ? { start, end } : undefined;
}

export function normalizeQuota(body: unknown, now: Date): Snapshot {
  const root = record(body);
  const base = { asOf: now.getTime() };
  if (root.token_based_billing !== true) return { ...base, kind: 'unavailable', reason: 'unsupportedQuota' };
  const quota = record(record(root.quota_snapshots).premium_interactions);
  const resetAt = number(quota.quota_reset_at);
  const cycle = billingCycle(resetAt && resetAt > 0 ? resetAt : root.quota_reset_date_utc ?? root.quota_reset_date, now);
  const usedCredits = number(quota.credits_used);
  if (quota.unlimited === true && usedCredits !== undefined) return { ...base, cycle, kind: 'usageOnly', used: usedCredits };
  const total = number(quota.entitlement);
  const remaining = number(quota.quota_remaining);
  const percent = number(quota.percent_remaining, true);
  if (quota.unlimited !== false || total === undefined || total === 0 || (remaining === undefined && percent === undefined)) {
    return { ...base, cycle, kind: 'unavailable', reason: 'missingQuota' };
  }
  const usedPercent = percent !== undefined ? 100 - Math.min(100, Math.max(0, percent)) : Math.max(0, (total - remaining!) / total * 100);
  const used = remaining !== undefined ? Math.max(0, total - remaining) : total * usedPercent / 100;
  return { ...base, cycle, kind: 'bounded', used, total, usedPercent };
}

const DAY = 86_400_000;
export function equivalentDays(start: number, end: number, mode: DayMode): number {
  if (end <= start) return 0;
  if (mode === 'all') return (end - start) / DAY;
  let duration = 0;
  for (let cursor = start; cursor < end;) {
    const date = new Date(cursor);
    const next = Math.min(end, Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) duration += next - cursor;
    cursor = next;
  }
  return duration / DAY;
}

export function calculatePace(snapshot: Snapshot, now: Date, mode: DayMode): Pace {
  if (snapshot.kind !== 'bounded' || !snapshot.cycle || now.getTime() < snapshot.cycle.start || now.getTime() >= snapshot.cycle.end) {
    return { kind: 'unavailable', label: 'Pace unavailable' };
  }
  const elapsed = equivalentDays(snapshot.cycle.start, now.getTime(), mode);
  if (elapsed < 1) return { kind: 'pending', label: 'Calculating pace' };
  const remaining = equivalentDays(now.getTime(), snapshot.cycle.end, mode);
  const dailyAverage = snapshot.used / elapsed;
  const projected = snapshot.used + dailyAverage * remaining;
  const projectedPercent = projected / snapshot.total * 100;
  let label: Extract<Pace, { kind: 'available' }>['label'] = 'Comfortable';
  if (projectedPercent > 100 + 1e-9) label = 'Over pace';
  else if (projectedPercent >= 90 - 1e-9) label = 'On track';
  return { kind: 'available', dailyAverage, projected, projectedPercent, label };
}

export type Forecast =
  | { kind: 'available'; exhausted: boolean; exhaustionAt?: number; excess: number }
  | { kind: 'unavailable' };

export function calculateForecast(snapshot: Snapshot, now: Date, mode: DayMode): Forecast {
  const cycle = snapshot.cycle;
  if (snapshot.kind !== 'bounded' || !cycle || now.getTime() < snapshot.asOf || now.getTime() >= cycle.end ||
      snapshot.asOf < cycle.start || snapshot.asOf >= cycle.end) return { kind: 'unavailable' };
  // Anchor the estimate to the observation: time spent offline must not lower the burn rate.
  const pace = calculatePace(snapshot, new Date(snapshot.asOf), mode);
  if (pace.kind !== 'available') return { kind: 'unavailable' };
  const result: Forecast = {
    kind: 'available', exhausted: snapshot.used >= snapshot.total,
    excess: Math.max(0, pace.projected - snapshot.total),
  };
  if (result.exhausted || pace.dailyAverage <= 0 || pace.projected <= snapshot.total) return result;
  let days = (snapshot.total - snapshot.used) / pace.dailyAverage;
  let cursor = snapshot.asOf;
  while (cursor < cycle.end) {
    const date = new Date(cursor);
    const next = Math.min(cycle.end, Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
    if (mode === 'all' || (date.getUTCDay() !== 0 && date.getUTCDay() !== 6)) {
      const available = (next - cursor) / DAY;
      if (days <= available) {
        result.exhaustionAt = cursor + days * DAY;
        break;
      }
      days -= available;
    }
    cursor = next;
  }
  return result;
}
