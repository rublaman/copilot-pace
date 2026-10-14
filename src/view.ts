import { Buffer } from 'node:buffer';
import { calculatePace, equivalentDays, type Clock, type DayMode } from './domain';
import type { ServiceState } from './service';

const amountFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const percentFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
const periodFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const amount = (value: number) => amountFormatter.format(value);
function percent(value: number): string {
  const formatted = percentFormatter.format(value);
  return `${value > 0 && formatted === '0' ? '<0.1' : formatted}%`;
}
const date = (value: number) => dateFormatter.format(value) + ' UTC';
export interface ViewModel {
  statusText: string; summary: string; message: string; demo: boolean; scenario: string;
  used: string; total: string; percentage: string; renewal: string; dailyAverage: string; projection: string;
  updated: string; referenceDate: string; dayMode: DayMode; busy: boolean; canConnect: boolean; retry: string;
  tone: 'good' | 'watch' | 'over' | 'neutral'; remaining: string; allowance: string; baseRate: string;
  cycleProgress: string; daysLeft: string; period: string; forecastNote: string;
  usageValue: number | null; cycleValue: number | null;
}
export function createViewModel(state: ServiceState, clock: Clock, dayMode: DayMode, demo: boolean, scenario: string, retryAt: number): ViewModel {
  const snapshot = state.snapshot;
  const now = clock.now();
  const pace = snapshot ? calculatePace(snapshot, now, dayMode) : undefined;
  let summary = 'Reading usage…';
  let tone: ViewModel['tone'] = 'neutral';
  if (state.phase === 'disconnected') summary = 'Connect GitHub';
  else if (state.phase === 'error') summary = snapshot ? 'Out of date' : state.failure?.code === 'rateLimited' ? 'Waiting' : 'Unavailable';
  else if (snapshot?.kind === 'unavailable') summary = 'Quota unavailable';
  else if (snapshot?.kind === 'usageOnly') summary = 'No known limit';
  else if (snapshot?.kind === 'bounded') {
    summary = pace?.label ?? 'Pace unavailable';
    if (pace?.kind === 'available') tone = pace.label === 'Comfortable' ? 'good' : pace.label === 'On track' ? 'watch' : 'over';
  }
  const cycle = snapshot?.cycle;
  const validCycle = cycle && now.getTime() >= cycle.start && now.getTime() < cycle.end;
  const totalDays = validCycle ? equivalentDays(cycle.start, cycle.end, dayMode) : 0;
  const daysLeft = validCycle ? equivalentDays(now.getTime(), cycle.end, dayMode) : 0;
  const cycleValue = totalDays > 0 ? (totalDays - daysLeft) / totalDays * 100 : null;
  const remaining = snapshot?.kind === 'bounded' ? Math.max(0, snapshot.total - snapshot.used) : undefined;
  const percentage = snapshot?.kind === 'bounded' ? percent(snapshot.usedPercent) : '—';
  const forecastNote = pace?.kind === 'available'
    ? pace.label === 'Comfortable' ? 'Your current pace leaves room in this cycle’s budget.'
      : pace.label === 'On track' ? 'Your projected usage is close to this cycle’s budget.'
      : 'At this pace, you may exceed your budget before renewal.'
    : pace?.kind === 'pending' ? 'A daily estimate will appear after one full eligible day.'
      : 'A known budget and billing cycle are needed to estimate your pace.';
  const message = state.failure?.message ?? (snapshot?.kind === 'unavailable' ? snapshot.reason
    : state.phase === 'disconnected' ? 'Connect GitHub to view your Copilot usage.' : forecastNote);
  return {
    statusText: `${snapshot?.kind === 'bounded' ? `${percentage} · ` : ''}${summary}${demo ? ' · Demo' : ''}`,
    summary, tone, message, demo, scenario, forecastNote,
    used: snapshot && snapshot.kind !== 'unavailable' ? `${amount(snapshot.used)} credits` : '—',
    total: snapshot?.kind === 'bounded' ? `${amount(snapshot.total)} credits` : '—',
    remaining: remaining !== undefined ? `${amount(remaining)} credits` : '—',
    percentage, renewal: cycle ? date(cycle.end) : '—',
    dailyAverage: pace?.kind === 'available' ? `${amount(pace.dailyAverage)} / day` : '—',
    allowance: remaining !== undefined && daysLeft > 0 ? `${amount(remaining / daysLeft)} / day` : '—',
    baseRate: snapshot?.kind === 'bounded' && totalDays > 0 ? `${amount(snapshot.total / totalDays)} / day` : '—',
    projection: pace?.kind === 'available' ? `${amount(pace.projected)} credits (${percent(pace.projectedPercent)})` : '—',
    cycleProgress: cycleValue !== null ? `${amount(cycleValue)}%` : '—',
    daysLeft: validCycle ? `${amount(daysLeft)} ${dayMode === 'weekdays' ? 'weekdays' : 'days'} left` : 'Cycle unavailable',
    period: validCycle ? periodFormatter.format(cycle.start) : 'Current cycle',
    usageValue: snapshot?.kind === 'bounded' ? snapshot.usedPercent : null, cycleValue,
    updated: state.updatedAt !== undefined ? date(state.updatedAt) : '—',
    referenceDate: demo ? date(now.getTime()) : '', dayMode, busy: state.phase === 'loading', canConnect: !demo,
    retry: retryAt > now.getTime() ? `Next refresh allowed: ${date(retryAt)}` : '',
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
  const inset = (value: string) => `\u2002${value}\u2002`;
  const row = (value: string) => `${inset(value)}  `;
  // An invisible character keeps the first and last spacer lines when Markdown trims whitespace.
  const verticalSpace = '\u200b  ';
  const icon = model.tone === 'good' ? 'pass' : model.tone === 'watch' ? 'clock' : model.tone === 'over' ? 'warning' : 'info';
  const lines = [
    verticalSpace,
    row(`**Copilot Pace**${__DEV__ && model.demo ? '　·　**DEMO**' : ''}`),
    '', divider, '', row(`$(${icon}) **${text(model.summary)}**`), '', row(text(model.message)), '', divider, '',
    row('**This cycle**'), '',
    row(`Used: **${text(model.used)}**　·　Remaining: **${text(model.remaining)}**`),
    row(`Budget: ${text(model.total)}　·　Renewal: ${text(model.renewal)}`),
    '', divider, '', row('**Progress**'), '',
    row(`Credits used: **${text(model.percentage)}**　·　Cycle elapsed: ${text(model.cycleProgress)}`),
    row(`Time left: ${text(model.daysLeft)}`),
    '', divider, '', row(`**Daily pace** · ${model.dayMode === 'weekdays' ? 'Mon–Fri' : 'Every day'}`), '',
    row(`Average: ${text(model.dailyAverage)}　·　Available: **${text(model.allowance)}**`),
    row(`Cycle baseline: ${text(model.baseRate)}`),
    row(`Projected at renewal: **${text(model.projection)}**`),
  ];
  if (__DEV__ && model.demo) lines.push('', row(`$(beaker) Simulated data · ${text(model.referenceDate)}`));
  if (model.retry) lines.push('', row(text(model.retry)));
  lines.push('', divider, '', row(`Updated ${text(model.updated)}`), '',
    row('[$(graph) Open details](command:copilotPace.showDetails)　[$(refresh) Refresh](command:copilotPace.refresh)' +
      (__DEV__ && model.demo ? '　[Change demo](command:copilotPace.demo)' : '　[Connect GitHub](command:copilotPace.connect)')),
    verticalSpace);
  return lines.join('\n');
}
