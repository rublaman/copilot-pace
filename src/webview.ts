import type { ViewModel } from './view';
import { chartLayout } from './chart';

declare function acquireVsCodeApi(): { postMessage(message: { action: string; value?: string }): void };
declare const initialModel: ViewModel;

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing panel element: ${id}`);
  // The caller selects a native control type for IDs fixed by the panel template.
  return found as T;
}

const vscode = acquireVsCodeApi();
let currentLanguage: ViewModel['language'];
function drawHistory(model: ViewModel) {
  const layer = element('historyPoints');
  layer.replaceChildren();
  const create = (tag: string, attributes: Record<string, string | number>, label?: string) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    if (label) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = label;
      element.appendChild(title);
    }
    layer.appendChild(element);
  };
  const drawPath = (path: string, className: string) => {
    if (model.historyBudget.length === 0) {
      create('path', { d: path, class: className });
      return;
    }
    create('path', { d: path, class: className + ' good', 'clip-path': 'url(#historyWithinClip)' });
    create('path', { d: path, class: className + ' over', 'clip-path': 'url(#historyOverClip)' });
  };
  if (model.chartStyle === 'columns') {
    for (const point of model.historyColumns) {
      create('rect', {
        x: point.x - 5, y: point.y, width: 10, height: Math.max(.5, chartLayout.bottom - point.y),
        rx: 3, class: 'chart-column ' + point.tone + (point.partial ? ' partial' : ''), tabindex: 0, 'aria-label': point.label,
      }, point.label);
    }
    return;
  }
  const segments: ViewModel['history'][] = [];
  for (const point of model.history) {
    if (!point.connect || segments.length === 0) segments.push([]);
    segments[segments.length - 1]!.push(point);
  }
  for (const segment of segments) {
    const first = segment[0]!;
    const last = segment[segment.length - 1]!;
    const path = segment.map((point, index) => (index === 0 ? 'M' : 'L') + point.x + ' ' + point.y).join('');
    if (segment.length > 1) {
      drawPath(path, 'chart-line');
    }
    if (model.chartMetric !== 'daily') {
      create('circle', { cx: first.x, cy: first.y, r: 3, class: 'chart-dot ' + first.tone }, first.label);
      if (last !== first) create('circle', { cx: last.x, cy: last.y, r: 3, class: 'chart-dot ' + last.tone }, last.label);
    }
  }
  if (model.chartMetric === 'daily') {
    for (const point of model.history) create('circle', {
      cx: point.x, cy: point.y, r: 3.5, class: 'chart-dot ' + point.tone + (point.partial ? ' partial' : ''),
      tabindex: 0, 'aria-label': point.label,
    }, point.label);
  }
  const latest = model.history[model.history.length - 1];
  if (latest) create('circle', { cx: latest.x, cy: latest.y, r: 4.5, class: 'chart-last ' + latest.tone, tabindex: 0, 'aria-label': latest.label }, latest.label);
}
function drawCalendarTicks(model: ViewModel) {
  const layer = element('historyCalendarTicks');
  const marks = element('historyCalendarMarks');
  layer.replaceChildren();
  marks.replaceChildren();
  for (const tick of model.historyCalendarTicks) {
    const mark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mark.setAttribute('d', `M${tick.x} ${chartLayout.bottom}v7`);
    marks.appendChild(mark);
    const label = document.createElement('span');
    label.setAttribute('class', 'chart-calendar-label' + (tick.weekend ? '' : ' monday'));
    label.style.left = (tick.x / chartLayout.svgWidth * 100) + '%';
    label.textContent = tick.label;
    layer.appendChild(label);
  }
}
function show(model: ViewModel) {
  currentLanguage = model.language;
  element('page').setAttribute('lang', model.language);
  element('content').setAttribute('data-tone', model.tone);

  const labelIds = [
    'eyebrow', 'budgetUsedLabel', 'remainingLabel', 'progressHeading',
    'usageBarLabel', 'cycleBarLabel', 'paceHeading', 'all', 'weekdays',
    'averageHeading', 'averageHint', 'allowanceHeading', 'allowanceHint',
    'projectionLabel', 'projectionHint', 'baselinePrefix', 'calendarNote', 'accountHeading',
    'renewalHeading', 'updatedHeading', 'refresh',
    'depletionHeading', 'excessHeading', 'forecastHint', 'historyHeading',
    'statusStyleLabel', 'styleText', 'styleCompact', 'styleBar', 'styleDots',
    'customizationHeading', 'languageLabel',
    'chartStyleLabel', 'chartLine', 'chartColumns', 'metricCumulative', 'metricDaily',
    'historyFileLabel', 'openHistory', 'revealHistory',
    'historyObservedLabel', 'historyWithinLabel', 'historyOverLabel', 'historyBudgetLabel', 'historyColumnsNote',
  ] as const;
  for (const id of labelIds) {
    element(id).textContent = model.text[id];
  }
  element('days').setAttribute('aria-label', model.text.daysAria);
  element('language').textContent = model.text.switchLanguage;
  element('language').setAttribute('aria-label', model.text.switchLanguageAria);

  const valueIds = [
    'summary', 'message', 'used', 'total', 'percentage', 'remaining', 'renewal',
    'dailyAverage', 'allowance', 'projection', 'updated', 'retry',
    'cycleProgress', 'daysLeft', 'period', 'baseRate', 'accountLabel',
    'depletion', 'excess', 'historyMaximum', 'historyStart', 'historyEnd', 'historyMessage',
    'historyLatest', 'chartStyleName', 'historyMetricLabel', 'historyLatestDate',
    'historyBudgetTarget', 'historyBudgetTargetHint',
  ] as const;
  for (const id of valueIds) {
    element(id).textContent = model[id];
  }
  element<HTMLSelectElement>('statusStyle').value = model.statusStyle;
  element<HTMLSelectElement>('chartStyle').value = model.chartStyle;
  element('historyFile').hidden = !model.showHistoryFile;
  element<HTMLButtonElement>('openHistory').disabled = !model.canOpenHistory;
  element<HTMLButtonElement>('revealHistory').disabled = !model.canOpenHistory;
  let fileNote = model.text.historyFileEmpty;
  if (model.demo) fileNote = model.text.historyDemo;
  else if (model.canOpenHistory) fileNote = model.text.historyFileNote;
  element('historyFileNote').textContent = fileNote;
  const chart = element('historyChart');
  element('historyPlot').hidden = model.history.length === 0;
  chart.setAttribute('aria-label', model.historyAria);
  chart.setAttribute('role', model.chartMetric === 'daily' ? 'group' : 'img');
  const budgetPath = model.historyBudget.map((point, index) => (index === 0 ? 'M' : 'L') + point.x + ' ' + point.y).join('');
  element('historyBudget').setAttribute('d', budgetPath);
  const target = element('historyBudgetTargetPosition');
  target.hidden = !model.historyBudgetTarget;
  target.style.top = (model.historyBudgetTargetY / chartLayout.svgHeight * 100) + '%';
  element('historyBudgetLeader').setAttribute('d', model.historyBudgetTarget ? `M${chartLayout.right} ${model.historyBudgetTargetY}H${chartLayout.svgWidth}` : '');
  element('historyWithinClipShape').setAttribute('d', budgetPath ? `${budgetPath}L${chartLayout.right} ${chartLayout.clipBottom}L${chartLayout.left} ${chartLayout.clipBottom}Z` : '');
  element('historyOverClipShape').setAttribute('d', budgetPath ? `${budgetPath}L${chartLayout.right} 0L${chartLayout.left} 0Z` : '');
  element('historyLatest').setAttribute('data-chart-tone', model.historyLatestTone);
  element('historyObservedLabel').hidden = model.historyBudget.length > 0;
  element('historyWithinLabel').hidden = model.historyBudget.length === 0;
  element('historyOverLabel').hidden = model.historyBudget.length === 0;
  element('historyBudgetLabel').hidden = model.historyBudget.length === 0;
  element('historyColumnsNote').hidden = model.chartStyle !== 'columns' || model.chartMetric === 'daily';
  element('chartMetrics').setAttribute('aria-label', model.text.chartMetricAria);
  element('metricCumulative').setAttribute('aria-pressed', String(model.chartMetric === 'cumulative'));
  element('metricDaily').setAttribute('aria-pressed', String(model.chartMetric === 'daily'));
  drawHistory(model);
  drawCalendarTicks(model);
  if (__DEV__) {
    element('demo').hidden = !model.demo;
    const note = element('demoNote');
    note.hidden = !model.demo;
    note.textContent = model.text.simulatedData + ' · ' + model.scenario + ' · ' + model.text.asOf + ' ' + model.referenceDate;
  }

  element('usageLabel').textContent = model.percentage;
  for (const [id, value] of [['usageBar', model.usageValue], ['cycleBar', model.cycleValue]] as const) {
    const bar = element<HTMLProgressElement>(id);
    bar.value = value === null ? 0 : Math.min(100, Math.max(0, value));
    const percentage = id === 'usageBar' ? model.percentage : model.cycleProgress;
    const description = value === null ? model.text.unavailable
      : percentage.replace('%', model.text.percentAria).replace('<', model.text.lessThan);
    bar.setAttribute('aria-valuetext', description);
  }
  element<HTMLButtonElement>('connect').hidden = !model.canConnect;
  element<HTMLButtonElement>('connect').textContent = model.connectLabel;
  for (const id of ['accountHeading', 'accountLabel']) {
    element(id).hidden = !model.accountLabel;
  }
  element<HTMLButtonElement>('refresh').disabled = model.busy;
  element<HTMLButtonElement>('connect').disabled = model.busy;
  for (const mode of ['all', 'weekdays']) {
    element(mode).setAttribute('aria-pressed', String(model.dayMode === mode));
  }
}
show(initialModel);
window.addEventListener('message', (event: MessageEvent<{ type: string; model: ViewModel } | undefined>) => {
  if (event.data && event.data.type === 'state') show(event.data.model);
});
element<HTMLButtonElement>('refresh').addEventListener('click', () => vscode.postMessage({ action: 'refresh' }));
element<HTMLButtonElement>('connect').addEventListener('click', () => vscode.postMessage({ action: 'connect' }));
element<HTMLButtonElement>('openHistory').addEventListener('click', () => vscode.postMessage({ action: 'openHistory' }));
element<HTMLButtonElement>('revealHistory').addEventListener('click', () => vscode.postMessage({ action: 'revealHistory' }));
element('language').addEventListener('click', () => {
  vscode.postMessage({ action: 'language', value: currentLanguage === 'en' ? 'es-ES' : 'en' });
});
const statusStyle = element<HTMLSelectElement>('statusStyle');
statusStyle.addEventListener('change', () => {
  vscode.postMessage({ action: 'statusStyle', value: statusStyle.value });
});
const chartStyle = element<HTMLSelectElement>('chartStyle');
chartStyle.addEventListener('change', () => {
  vscode.postMessage({ action: 'chartStyle', value: chartStyle.value });
});
for (const mode of ['all', 'weekdays']) {
  element(mode).addEventListener('click', () => vscode.postMessage({ action: 'dayMode', value: mode }));
}
for (const metric of ['Cumulative', 'Daily']) {
  element('metric' + metric).addEventListener('click', () => vscode.postMessage({ action: 'chartMetric', value: metric.toLowerCase() }));
}
vscode.postMessage({ action: 'ready' });
