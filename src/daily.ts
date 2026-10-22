import type { Cycle } from './domain';
import type { Observation } from './history';

export const UTC_DAY = 86_400_000;
export interface DailyUsage { day: number; used: number; partial: boolean }

export function observedDailyUsage(observations: readonly Observation[], cycle: Cycle): DailyUsage[] {
  const days = new Map<number, number>();
  const items = observations.filter(item => item.start === cycle.start && item.end === cycle.end);
  for (let index = 1; index < items.length; index++) {
    const previous = items[index - 1]!;
    const current = items[index]!;
    const day = Math.floor(current.at / UTC_DAY) * UTC_DAY;
    // A difference crossing midnight or a long offline interval has no reliable daily attribution.
    if (Math.floor(previous.at / UTC_DAY) * UTC_DAY !== day || current.at <= previous.at ||
        current.at - previous.at > 2 * 60 * 60_000 || current.total !== previous.total || current.used < previous.used) continue;
    days.set(day, (days.get(day) ?? 0) + current.used - previous.used);
  }
  return [...days].map(([day, used]) => ({ day, used, partial: true }));
}

export function mergeDailyUsage(local: readonly DailyUsage[], reported: readonly DailyUsage[]): DailyUsage[] {
  const days = new Map(local.map(item => [item.day, item]));
  for (const item of reported) days.set(item.day, item);
  return [...days.values()].sort((a, b) => a.day - b.day);
}
