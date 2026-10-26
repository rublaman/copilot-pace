import { equivalentDays, type DayMode, type Snapshot } from './domain';
import { chartLayout, chartTone, type ChartMetric, type ChartTone } from './chart';
import { mergeDailyUsage, observedDailyUsage, UTC_DAY, type DailyUsage } from './daily';
import type { Observation } from './history';
import { formatters } from './formatters';
import { getStrings, type Language } from './i18n';

export interface HistoryPoint {
  x: number; y: number; connect: boolean; label: string; partial?: boolean; tone: ChartTone;
}
export interface HistoryViewModel {
  history: HistoryPoint[];
  historyMaximum: string; historyStart: string; historyEnd: string;
  historyBudget: Array<{ x: number; y: number }>;
  historyMessage: string; historyLatest: string;
  historyMetricLabel: string; historyLatestDate: string; historyAria: string;
  historyLatestTone: ChartTone; historyColumns: HistoryPoint[];
  historyBudgetTarget: string; historyBudgetTargetY: number; historyBudgetTargetHint: string;
  historyCalendarTicks: Array<{ x: number; label: string; weekend: boolean }>;
}

export function createHistoryViewModel(snapshot: Snapshot | undefined, now: Date, dayMode: DayMode, language: Language,
  options: { demo: boolean; chartMetric: ChartMetric; history: readonly Observation[]; dailyUsage: readonly DailyUsage[]; historyFailed: boolean }): HistoryViewModel {
  const { demo, chartMetric, history, dailyUsage, historyFailed } = options;
  const text = getStrings(language);
  const formatter = formatters[language];
  const amount = (value: number) => formatter.number.format(value);
  const date = (value: number) => formatter.date.format(value) + ' UTC';
  const cycle = snapshot?.cycle;
  const validCycle = cycle && now.getTime() >= cycle.start && now.getTime() < cycle.end;
  const totalDays = validCycle ? equivalentDays(cycle.start, cycle.end, dayMode) : 0;
  const observations = validCycle ? history.filter(item => item.start === cycle.start && item.end === cycle.end && item.at <= now.getTime()) : [];
  const daily = validCycle && !demo ? mergeDailyUsage(observedDailyUsage(observations, cycle),
    dailyUsage.filter(item => item.day >= cycle.start && item.day < cycle.end && item.day <= now.getTime())) : [];
  const dailyMode = chartMetric === 'daily';
  const baseRate = snapshot?.kind === 'bounded' && totalDays > 0 ? snapshot.total / totalDays : 0;
  const knownBudget = snapshot?.kind === 'bounded' && !!validCycle && totalDays > 0;
  const pointLabel = (at: number, used: number, pointTone: ChartTone, partial = false) => {
    const status = { good: text.historyWithinLabel, over: text.historyOverLabel, neutral: '' }[pointTone];
    return `${date(at)}${status ? ` · ${status}` : ''} · ${amount(used)} ${text.credits}${partial ? ` · ${text.historyPartial}` : ''}`;
  };
  let historyMessage = text.historyNote;
  if (dailyMode) historyMessage = daily.length ? text.historyDailyNote : text.historyDailyEmpty;
  if (demo) historyMessage = text.historyDemo;
  else if (historyFailed) historyMessage = text.historyError;
  else if (!dailyMode && observations.length === 0) historyMessage = text.historyEmpty;
  const cycleBudget = snapshot?.kind === 'bounded' ? snapshot.total : 0;
  const maximum = dailyMode ? Math.max(1, baseRate, ...daily.map(item => item.used))
    : Math.max(1, cycleBudget, ...observations.map(item => item.used));
  let points: HistoryPoint[] = [];
  if (dailyMode && validCycle) {
    points = daily.map((item, index) => {
      const previous = daily[index - 1];
      const allowance = knownBudget ? baseRate * equivalentDays(item.day, item.day + UTC_DAY, dayMode) : undefined;
      const pointTone = chartTone(item.used, allowance);
      return {
        x: chartLayout.left + (item.day + UTC_DAY / 2 - cycle.start) / (cycle.end - cycle.start) * chartLayout.width,
        y: chartLayout.bottom - item.used / maximum * chartLayout.height,
        connect: !!previous && item.day - previous.day === UTC_DAY,
        label: pointLabel(item.day, item.used, pointTone, item.partial),
        partial: item.partial, tone: pointTone,
      };
    });
  } else if (!dailyMode) {
    points = observations.map((item, index) => {
      const previous = observations[index - 1];
      const allowance = knownBudget ? baseRate * equivalentDays(item.start, item.at, dayMode) : undefined;
      const pointTone = chartTone(item.used, allowance);
      return {
        x: chartLayout.left + (item.at - item.start) / (item.end - item.start) * chartLayout.width,
        y: chartLayout.bottom - item.used / maximum * chartLayout.height,
        connect: !!previous && item.at - previous.at <= 2 * 60 * 60_000 && item.used >= previous.used && item.total === previous.total,
        label: pointLabel(item.at, item.used, pointTone), tone: pointTone,
      };
    });
  }
  // Cumulative columns use the last snapshot per UTC day; daily columns keep each known total.
  const dayIndices = new Map<string, number>();
  observations.forEach((item, index) => dayIndices.set(new Date(item.at).toISOString().slice(0, 10), index));
  const columns = dailyMode ? points : [...dayIndices.values()].map(index => points[index]!);
  const budget: Array<{ x: number; y: number }> = [];
  const historyCalendarTicks: HistoryViewModel['historyCalendarTicks'] = [];
  if (snapshot?.kind === 'bounded' && validCycle && totalDays > 0) {
    for (let cursor = cycle.start; cursor <= cycle.end; cursor += UTC_DAY) {
      if (dailyMode && cursor < cycle.end) {
        const allowance = baseRate * equivalentDays(cursor, cursor + UTC_DAY, dayMode);
        const y = chartLayout.bottom - allowance / maximum * chartLayout.height;
        budget.push({ x: chartLayout.left + (cursor - cycle.start) / (cycle.end - cycle.start) * chartLayout.width, y },
          { x: chartLayout.left + (cursor + UTC_DAY - cycle.start) / (cycle.end - cycle.start) * chartLayout.width, y });
        // Mark the two daily-budget transitions without crowding every day on the axis.
        const weekday = new Date(cursor).getUTCDay();
        if (dayMode === 'weekdays' && cursor > cycle.start && (weekday === 1 || weekday === 6)) {
          historyCalendarTicks.push({
            x: chartLayout.left + (cursor - cycle.start) / (cycle.end - cycle.start) * chartLayout.width,
            label: formatter.shortDate.format(cursor),
            weekend: weekday === 6,
          });
        }
      } else if (!dailyMode) {
        budget.push({
          x: chartLayout.left + (cursor - cycle.start) / (cycle.end - cycle.start) * chartLayout.width,
          y: chartLayout.bottom - snapshot.total / maximum * equivalentDays(cycle.start, cursor, dayMode) / totalDays * chartLayout.height,
        });
      }
    }
  }
  let historyLatest = '—';
  let historyLatestDate = '';
  if (dailyMode && daily.length) {
    const latest = daily[daily.length - 1]!;
    historyLatest = `${amount(latest.used)} ${text.credits}`;
    historyLatestDate = `${date(latest.day)}${latest.partial ? ` · ${text.historyPartial}` : ''}`;
  } else if (!dailyMode && observations.length) {
    historyLatest = `${amount(observations[observations.length - 1]!.used)} ${text.credits}`;
  }
  let historyBudgetTarget = '';
  let historyBudgetTargetY = chartLayout.top;
  let historyBudgetTargetHint = text.historyCycleTarget;
  if (knownBudget) {
    const target = dailyMode ? baseRate : snapshot.total;
    historyBudgetTarget = `${amount(target)} ${text.credits}`;
    historyBudgetTargetY = chartLayout.bottom - target / maximum * chartLayout.height;
  }
  if (dailyMode) historyBudgetTargetHint = dayMode === 'weekdays' ? text.historyWeekdayTarget : text.historyDailyTarget;
  return {
    history: points, historyMaximum: `${amount(maximum)} ${text.credits}`,
    historyStart: validCycle ? formatter.shortDate.format(cycle.start) : '',
    historyEnd: validCycle ? formatter.shortDate.format(cycle.end) : '',
    historyBudget: budget, historyBudgetTarget, historyBudgetTargetY, historyBudgetTargetHint,
    historyCalendarTicks, historyMessage,
    historyMetricLabel: dailyMode ? text.historyDailyLabel : text.historyMetricLabel,
    historyAria: dailyMode ? text.historyDailyAria : text.historyAria,
    historyLatestDate, historyLatest,
    historyLatestTone: points[points.length - 1]?.tone ?? 'neutral',
    historyColumns: columns,
  };
}
