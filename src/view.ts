import { Buffer } from 'node:buffer';
import { calculateForecast, calculatePace, equivalentDays, type Clock, type DayMode } from './domain';
import { statusText, type StatusStyle } from './status';
import type { Observation } from './history';
import { getStrings, type Language, type Strings } from './i18n';
import { localizeDemoScenario } from './development';
import type { ServiceState } from './service';
import type { SafeError } from './transport';

const formatters = Object.fromEntries((['en', 'es-ES'] as const).map(language => {
  const locale = language === 'en' ? 'en-US' : language;
  return [language, {
    number: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }),
    period: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  }];
})) as Record<Language, { number: Intl.NumberFormat; date: Intl.DateTimeFormat; period: Intl.DateTimeFormat }>;

function failureMessage(failure: SafeError, language: Language, text: Strings): string {
  if (language === 'en') return failure.message;
  if (failure.code === 'server') {
    const status = failure.message.match(/\bHTTP (\d{3})\b/)?.[1];
    return `${text.errorServer}${status ? ` (HTTP ${status})` : ''}.`;
  }
  return {
    timeout: text.errorTimeout, network: text.errorNetwork, invalidResponse: text.errorInvalidResponse,
    unauthorized: text.errorUnauthorized, forbidden: text.errorForbidden, rateLimited: text.errorRateLimited,
    cancelled: text.errorCancelled, auth: text.errorAuth, configuration: text.errorConfiguration, configurationChanged: text.errorConfigurationChanged,
  }[failure.code];
}
export interface ViewModel {
  language: Language; text: Strings;
  statusText: string; summary: string; message: string; demo: boolean; scenario: string;
  used: string; total: string; percentage: string; renewal: string; dailyAverage: string; projection: string;
  updated: string; referenceDate: string; dayMode: DayMode; busy: boolean; canConnect: boolean; retry: string;
  tone: 'good' | 'watch' | 'over' | 'neutral'; remaining: string; allowance: string; baseRate: string;
  cycleProgress: string; daysLeft: string; period: string; forecastNote: string;
  usageValue: number | null; cycleValue: number | null;
  accountLabel: string; connectLabel: string;
  statusStyle: StatusStyle; statusDescription: string;
  depletion: string; excess: string;
  history: Array<{ x: number; y: number; connect: boolean; label: string }>;
  historyMaximum: string; historyStart: string; historyEnd: string; historyBudget: Array<{ x: number; y: number }>;
  historyMessage: string;
}
export function createViewModel(state: ServiceState, clock: Clock, dayMode: DayMode, demo: boolean, scenario: string, retryAt: number, language: Language = 'en',
  options: { statusStyle?: StatusStyle; history?: readonly Observation[]; historyFailed?: boolean } = {}): ViewModel {
  const { statusStyle: style = 'text', history = [], historyFailed = false } = options;
  const text = getStrings(language);
  const formatter = formatters[language];
  const amount = (value: number) => formatter.number.format(value);
  const percent = (value: number) => `${value > 0 && amount(value) === '0' ? `<${amount(0.1)}` : amount(value)}%`;
  const date = (value: number) => formatter.date.format(value) + ' UTC';
  const snapshot = state.snapshot;
  const now = clock.now();
  const observedAt = snapshot?.cycle && now.getTime() < snapshot.cycle.end ? new Date(Math.min(now.getTime(), snapshot.asOf)) : now;
  const pace = snapshot ? calculatePace(snapshot, observedAt, dayMode) : undefined;
  const pacePresentation = pace?.kind === 'available' ? {
    Comfortable: { summary: text.comfortable, tone: 'good' as const, note: text.comfortableNote },
    'On track': { summary: text.onTrack, tone: 'watch' as const, note: text.onTrackNote },
    'Over pace': { summary: text.overPace, tone: 'over' as const, note: text.overPaceNote },
  }[pace.label] : undefined;
  let summary = text.readingUsage;
  let tone: ViewModel['tone'] = 'neutral';
  if (state.phase === 'disconnected') {
    summary = text.connect;
  } else if (state.phase === 'error') {
    if (snapshot) summary = text.outOfDate;
    else summary = state.failure?.code === 'rateLimited' ? text.waiting : text.unavailable;
  } else if (snapshot?.kind === 'unavailable') {
    summary = text.quotaUnavailable;
  } else if (snapshot?.kind === 'usageOnly') {
    summary = text.noKnownLimit;
  } else if (snapshot?.kind === 'bounded') {
    summary = pacePresentation?.summary ?? (pace?.kind === 'pending' ? text.calculatingPace : text.paceUnavailable);
    tone = pacePresentation?.tone ?? 'neutral';
  }
  const cycle = snapshot?.cycle;
  const validCycle = cycle && now.getTime() >= cycle.start && now.getTime() < cycle.end;
  const totalDays = validCycle ? equivalentDays(cycle.start, cycle.end, dayMode) : 0;
  const daysLeft = validCycle ? equivalentDays(now.getTime(), cycle.end, dayMode) : 0;
  const cycleValue = totalDays > 0 ? (totalDays - daysLeft) / totalDays * 100 : null;
  const remaining = snapshot?.kind === 'bounded' ? Math.max(0, snapshot.total - snapshot.used) : undefined;
  const percentage = snapshot?.kind === 'bounded' ? percent(snapshot.usedPercent) : '—';
  const forecastNote = pacePresentation?.note ?? (pace?.kind === 'pending' ? text.pendingNote : text.unavailableNote);
  let quotaReason: string | undefined;
  if (snapshot?.kind === 'unavailable') {
    quotaReason = language === 'en' ? snapshot.reason
      : snapshot.reason === 'No supported credit quota was returned.' ? text.unsupportedQuota : text.missingQuota;
  }
  const message = state.failure ? failureMessage(state.failure, language, text)
    : quotaReason ?? (state.phase === 'disconnected' ? text.connectNote : forecastNote);
  const reconnect = state.failure?.code === 'unauthorized' || (state.failure?.code === 'auth' && state.account !== undefined);
  const forecast = snapshot && state.phase === 'ready' ? calculateForecast(snapshot, now, dayMode) : undefined;
  let depletion = '—';
  let excess = '—';
  if (forecast?.kind === 'available') {
    if (forecast.exhausted) depletion = text.budgetExhausted;
    else if (forecast.exhaustionAt !== undefined) depletion = date(forecast.exhaustionAt);
    else depletion = text.notBeforeRenewal;
    excess = `${amount(forecast.excess)} ${text.credits}`;
  }
  if (state.phase === 'ready' && validCycle && snapshot?.kind === 'bounded' && snapshot.used >= snapshot.total) depletion = text.budgetExhausted;
  const observations = validCycle ? history.filter(item => item.start === cycle.start && item.end === cycle.end && item.at <= now.getTime()) : [];
  let historyMessage = text.historyNote;
  if (demo) historyMessage = text.historyDemo;
  else if (historyFailed) historyMessage = text.historyError;
  else if (observations.length === 0) historyMessage = text.historyEmpty;
  const maximum = Math.max(1, snapshot?.kind === 'bounded' ? snapshot.total : 0, ...observations.map(item => item.used));
  const points = observations.map((item, index) => {
    const previous = observations[index - 1];
    return {
      x: 32 + (item.at - item.start) / (item.end - item.start) * 520,
      y: 168 - item.used / maximum * 144,
      connect: !!previous && item.at - previous.at <= 2 * 60 * 60_000 && item.used >= previous.used && item.total === previous.total,
      label: `${date(item.at)} · ${amount(item.used)} ${text.credits}`,
    };
  });
  const budget: Array<{ x: number; y: number }> = [];
  if (snapshot?.kind === 'bounded' && validCycle && totalDays > 0) {
    for (let cursor = cycle.start; cursor <= cycle.end; cursor += 86_400_000) {
      budget.push({
        x: 32 + (cursor - cycle.start) / (cycle.end - cycle.start) * 520,
        y: 168 - snapshot.total / maximum * equivalentDays(cycle.start, cursor, dayMode) / totalDays * 144,
      });
    }
  }
  return {
    language, text,
    statusText: statusText(style, percentage, snapshot?.kind === 'bounded' ? snapshot.usedPercent : null, summary, tone === 'neutral', demo),
    statusDescription: `${percentage} · ${summary}`, statusStyle: style, depletion, excess,
    history: points, historyMaximum: `${amount(maximum)} ${text.credits}`,
    historyStart: validCycle ? date(cycle.start) : '', historyEnd: validCycle ? date(cycle.end) : '',
    historyBudget: budget,
    historyMessage,
    summary, tone, message, demo, scenario: __DEV__ ? localizeDemoScenario(scenario, language) : scenario, forecastNote,
    used: snapshot && snapshot.kind !== 'unavailable' ? `${amount(snapshot.used)} ${text.credits}` : '—',
    total: snapshot?.kind === 'bounded' ? `${amount(snapshot.total)} ${text.credits}` : '—',
    remaining: remaining !== undefined ? `${amount(remaining)} ${text.credits}` : '—',
    percentage, renewal: cycle ? date(cycle.end) : '—',
    dailyAverage: pace?.kind === 'available' ? `${amount(pace.dailyAverage)} ${text.perDay}` : '—',
    allowance: remaining !== undefined && daysLeft > 0 ? `${amount(remaining / daysLeft)} ${text.perDay}` : '—',
    baseRate: snapshot?.kind === 'bounded' && totalDays > 0 ? `${amount(snapshot.total / totalDays)} ${text.perDay}` : '—',
    projection: pace?.kind === 'available' ? `${amount(pace.projected)} ${text.credits} (${percent(pace.projectedPercent)})` : '—',
    cycleProgress: cycleValue !== null ? `${amount(cycleValue)}%` : '—',
    daysLeft: validCycle ? `${amount(daysLeft)} ${dayMode === 'weekdays' ? text.weekdaysLeft : text.daysLeft}` : text.cycleUnavailable,
    period: validCycle ? formatter.period.format(cycle.start) : text.currentCycle,
    usageValue: snapshot?.kind === 'bounded' ? snapshot.usedPercent : null, cycleValue,
    updated: state.updatedAt !== undefined ? date(state.updatedAt) : '—',
    referenceDate: demo ? date(now.getTime()) : '', dayMode, busy: state.phase === 'loading', canConnect: !demo,
    accountLabel: demo ? '' : state.account?.label ?? '',
    connectLabel: reconnect ? text.reconnect : state.account ? text.switchAccount : text.connect,
    retry: retryAt > now.getTime() ? `${text.nextRefresh} ${date(retryAt)}` : '',
  };
}
function markdownText(value: string): string {
  return value.replace(/[\\`*_{}[\]()<>#+!|$]/g, '\\$&').replace(/[\r\n]+/g, ' ');
}
export const hoverCommands = ['copilotPace.showDetails', 'copilotPace.refresh', 'copilotPace.connect'];
// The native horizontal rule bleeds to the edges; an image keeps a thin line and an 8px inner gutter.
const dividerSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="2" viewBox="0 0 500 2"><path d="M8 1H492" stroke="#808080" stroke-opacity=".5"/></svg>';
const divider = `![](data:image/svg+xml;base64,${Buffer.from(dividerSvg).toString('base64')}|width=500,height=2)`;
export function renderHover(model: ViewModel): string {
  const text = markdownText;
  const label = model.text;
  const inset = (value: string) => `\u2002${value}\u2002`;
  const row = (value: string) => `${inset(value)}  `;
  // An invisible character keeps the first and last spacer lines when Markdown trims whitespace.
  const verticalSpace = '\u200b  ';
  // A text check shares the label's baseline; hover codicons use vertical-align: middle.
  const icon = model.tone === 'good' ? '✓' : model.tone === 'watch' ? '$(clock)' : model.tone === 'over' ? '$(warning)' : '$(info)';
  const color = { good: 'green', watch: 'yellow', over: 'red', neutral: undefined }[model.tone];
  const summary = `${icon} **${text(model.summary)}**`;
  // Only this fixed span uses HTML; every dynamic label still passes through Markdown escaping.
  const status = color ? `<span style="color:var(--vscode-charts-${color});">${summary}</span>` : summary;
  const lines = [
    verticalSpace,
    row(`**Copilot Pace**${__DEV__ && model.demo ? '　·　**DEMO**' : ''}`),
    ...(model.accountLabel ? ['', row(`${label.accountHeading}: **${text(model.accountLabel)}**`)] : []),
    '', divider, '',
    row(`${status}${model.usageValue !== null ? ` · ${text(model.percentage)} ${label.usedSuffix}` : ''}`),
    ...(model.message !== model.forecastNote || model.projection === '—' ? ['', row(text(model.message))] : []),
    '', row(`${label.remainingHover}: **${text(model.remaining)}**`),
    ...(model.allowance !== '—' ? [row(`${label.allowanceHover}: **${text(model.allowance)}** · ${model.dayMode === 'weekdays' ? label.allowanceCalendarWeekdays : label.allowanceCalendarAll}`)] : []),
    row(`${label.projectionLabel}: **${text(model.projection)}**`),
    ...(model.depletion !== '—' ? [row(`${label.depletionHeading}: **${text(model.depletion)}**`), row(`${label.excessHeading}: **${text(model.excess)}**`)] : []),
    row(`${label.updatedHover} ${text(model.updated)}`),
  ];
  if (__DEV__ && model.demo) lines.push('', row(`$(beaker) ${label.simulatedData} · ${text(model.referenceDate)}`));
  if (model.retry) lines.push('', row(text(model.retry)));
  lines.push('', divider, '',
    row(`[$(graph) ${label.openDetails}](command:copilotPace.showDetails)　[$(refresh) ${label.refreshHover}](command:copilotPace.refresh)` +
      (__DEV__ && model.demo ? `　[${label.changeDemo}](command:copilotPace.demo)` : `　[${text(model.connectLabel)}](command:copilotPace.connect)`)),
    verticalSpace);
  return lines.join('\n');
}
