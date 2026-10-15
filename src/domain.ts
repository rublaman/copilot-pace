export type DayMode = 'all' | 'weekdays';
export interface Clock { now(): Date }
export const systemClock: Clock = { now: () => new Date() };
export interface Cycle { start: number; end: number }
interface BaseSnapshot { asOf: number; cycle?: Cycle }
export type Snapshot =
  | (BaseSnapshot & { kind: 'bounded'; used: number; total: number; usedPercent: number })
  | (BaseSnapshot & { kind: 'usageOnly'; used: number })
  | (BaseSnapshot & { kind: 'unavailable'; reason: string });
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
  const end = typeof reset === 'number' ? reset * 1000 : typeof reset === 'string' ? Date.parse(reset) : NaN;
  const date = new Date(end);
  // The supported credit cycle is the calendar month in UTC. Unknown cycles get no forecast.
  if (!Number.isFinite(end) || date.getUTCDate() !== 1 || date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || date.getUTCSeconds() !== 0) return;
  const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1);
  return now.getTime() >= start && now.getTime() < end ? { start, end } : undefined;
}

export function normalizeQuota(body: unknown, now: Date): Snapshot {
  const root = record(body);
  const base = { asOf: now.getTime() };
  if (root.token_based_billing !== true) return { ...base, kind: 'unavailable', reason: 'No supported credit quota was returned.' };
  const quota = record(record(root.quota_snapshots).premium_interactions);
  const resetAt = number(quota.quota_reset_at);
  const cycle = billingCycle(resetAt && resetAt > 0 ? resetAt : root.quota_reset_date_utc ?? root.quota_reset_date, now);
  const usedCredits = number(quota.credits_used);
  if (quota.unlimited === true && usedCredits !== undefined) return { ...base, cycle, kind: 'usageOnly', used: usedCredits };
  const total = number(quota.entitlement);
  const remaining = number(quota.quota_remaining);
  const percent = number(quota.percent_remaining, true);
  if (quota.unlimited !== false || total === undefined || total === 0 || (remaining === undefined && percent === undefined)) {
    return { ...base, cycle, kind: 'unavailable', reason: 'Your budget or usage is unavailable.' };
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
  const label = projectedPercent > 100 + 1e-9 ? 'Over pace' : projectedPercent >= 90 - 1e-9 ? 'On track' : 'Comfortable';
  return { kind: 'available', dailyAverage, projected, projectedPercent, label };
}
