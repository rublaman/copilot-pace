import type { ViewModel } from './view';
export { createViewModel, renderHover, hoverCommands, type ViewModel } from './view';

export function renderHtml(model: ViewModel, nonce: string, iconUri = '', cspSource = "'none'"): string {
  const initial = JSON.stringify(model).replaceAll('<', '\\u003c');
  return `<!DOCTYPE html>
<html id="page" lang="${model.language}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<title>Copilot Pace</title>
<style nonce="${nonce}">
  :root {
    color-scheme: light dark;
    --line:var(--vscode-widget-border,var(--vscode-panel-border));
    --muted:var(--vscode-descriptionForeground);
    --accent:var(--vscode-foreground);
    --surface:var(--vscode-sideBar-background,var(--vscode-editor-background));
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: var(--vscode-editor-background);
    color: var(--vscode-foreground);
    font-family: var(--vscode-font-family);
    font-size: 13px;
    line-height: 1.5;
  }

  main {
    max-width: 660px;
    margin: auto;
    padding: 28px 24px 24px;
  }

  h1,h2,p {
    margin: 0;
  }

  h1 {
    font-size: 17px;
    font-weight: 650;
    letter-spacing: -.3px;
  }

  h2 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  .eyebrow,.muted {
    color: var(--muted);
  }

  .eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 5px;
  }

  .badge {
    font-size: 11px;
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 3px 7px;
    white-space: nowrap;
  }

  .hero {
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 22px;
    background: var(--surface);
  }

  .hero-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .status {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
  }

  .usage {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-top: 16px;
  }

  .usage strong {
    font-size: 48px;
    font-weight: 600;
    letter-spacing: -2px;
    line-height: 1.1;
  }

  .usage span {
    color: var(--muted);
  }

  .used-of {
    color: var(--muted);
    margin-top: 7px;
  }

  .hero p:last-child {
    margin-top: 16px;
    font-size: 12px;
  }

  .remaining {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--line);
  }

  .remaining strong {
    font-variant-numeric: tabular-nums;
  }

  section {
    margin-top: 24px;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .section-head span {
    font-size: 12px;
    color: var(--muted);
  }

  .progress-row {
    display: grid;
    grid-template-columns: 86px 1fr 52px;
    align-items: center;
    gap: 12px;
    margin: 12px 0;
    font-size: 12px;
  }

  .progress-row strong {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  progress {
    appearance: none;
    display: block;
    width: 100%;
    height: 6px;
    border: 0;
    border-radius: 3px;
    overflow: hidden;
    background: var(--vscode-input-background);
  }

  progress::-webkit-progress-bar {
    background: var(--vscode-input-background);
    border: 1px solid var(--line);
    border-radius: 3px;
  }

  progress::-webkit-progress-value {
    background: var(--accent);
    border-radius: 3px;
  }

  #cycleBar::-webkit-progress-value {
    background: var(--muted);
  }

  .metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .metric {
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 14px;
  }

  .metric span {
    display: block;
    font-size: 12px;
    color: var(--muted);
  }

  .metric strong {
    display: block;
    margin: 6px 0;
    font-size: 20px;
    font-weight: 550;
    font-variant-numeric: tabular-nums;
  }

  .metric small {
    display: block;
    color: var(--muted);
    font-size: 11px;
  }

  .forecast {
    margin-top: 12px;
    padding: 14px;
    border-left: 2px solid var(--accent);
    background: var(--surface);
  }

  .forecast-metrics {
    margin-top: 12px;
  }

  .forecast span {
    font-size: 12px;
    color: var(--muted);
  }

  .forecast strong {
    display: block;
    font-size: 16px;
    margin-top: 4px;
  }

  .explanation {
    font-size: 11px;
    color: var(--muted);
    margin-top: 12px;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  button {
    font: inherit;
    cursor: pointer;
    padding: 6px 10px;
    color: var(--vscode-button-secondaryForeground);
    background: var(--vscode-button-secondaryBackground);
    border: 1px solid transparent;
    border-radius: 4px;
  }

  button:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }

  button:focus-visible {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }

  select {
    font: inherit;
    color: var(--vscode-dropdown-foreground);
    background: var(--vscode-dropdown-background);
    border: 1px solid var(--vscode-dropdown-border,var(--line));
    border-radius: 4px;
    padding: 6px 10px;
    max-width: 100%;
  }

  select:focus-visible {
    outline: 2px solid var(--vscode-focusBorder);
  }

  .appearance {
    margin-top: 18px;
    font-size: 12px;
  }

  .appearance label {
    color: var(--muted);
  }

  #historyChart {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
  }

  .chart-axis {
    fill: none;
    stroke: var(--line);
  }

  #historyBudget {
    fill: none;
    stroke: var(--muted);
    stroke-dasharray: 5 5;
  }

  #historyPoints {
    fill: var(--accent);
    stroke: var(--accent);
  }

  .chart-labels {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 11px;
    color: var(--muted);
  }

  button:disabled {
    opacity: .55;
    cursor: default;
  }

  .days {
    gap: 0;
    border: 1px solid var(--line);
    border-radius: 5px;
    padding: 2px;
  }

  .days button {
    font-size: 11px;
    padding: 4px 8px;
    color: var(--muted);
    background: transparent;
  }

  .days button:hover {
    background: var(--vscode-toolbar-hoverBackground,var(--vscode-button-secondaryHoverBackground));
    color: var(--vscode-foreground);
  }

  .days button[aria-pressed=true] {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    outline: 1px solid var(--line);
  }

  footer {
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px solid var(--line);
  }

  footer dl {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px;
    font-size: 11px;
    color: var(--muted);
    margin: 0 0 18px;
  }

  dt,dd {
    margin: 0;
  }

  dd {
    text-align: right;
  }

  #demoNote,#retry {
    font-size: 11px;
    color: var(--muted);
    margin-top: 12px;
  }

  [hidden] {
    display: none!important;
  }

  @media(max-width:420px) {
    main {
      padding: 18px 14px;
    }
    .hero {
      padding: 16px;
    }
    .metrics {
      grid-template-columns: 1fr;
    }
    .section-head {
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }
    .usage strong {
      font-size: 40px;
    }
    .progress-row {
      grid-template-columns: 75px 1fr 45px;
      gap: 8px;
    }
    footer dl {
      grid-template-columns: 1fr;
    }
    dd {
      text-align: left;
    }
    .remaining {
      flex-wrap: wrap;
    }
  }

  #connect {
    color: #fff;
    background: #238636;
    border-color: var(--vscode-contrastBorder,transparent);
  }

  #connect:hover:not(:disabled) {
    background: #1f7a30;
  }

  body.vscode-high-contrast #connect,body.vscode-high-contrast-light #connect {
    color: var(--vscode-button-foreground);
    background: var(--vscode-button-background);
  }

  body.vscode-high-contrast #connect:hover:not(:disabled),body.vscode-high-contrast-light #connect:hover:not(:disabled) {
    background: var(--vscode-button-hoverBackground);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .brand-icon {
    display: block;
    width: 40px;
    height: 40px;
    flex: none;
    object-fit: contain;
  }

  body.vscode-dark .brand-icon,body.vscode-high-contrast .brand-icon {
    filter: brightness(0) invert(1);
  }

  body.vscode-high-contrast-light .brand-icon {
    filter: none;
  }

  header {
    flex-wrap: wrap;
  }

  .header-tools {
    margin-left: auto;
    justify-content: flex-end;
  }

  .header-tools button {
    font-size: 12px;
  }

  main[data-tone=good] {
    --accent:var(--vscode-charts-green,var(--vscode-foreground));
  }

  main[data-tone=watch] {
    --accent:var(--vscode-charts-yellow,var(--vscode-foreground));
  }

  main[data-tone=over] {
    --accent:var(--vscode-charts-red,var(--vscode-foreground));
  }

  main[data-tone=good] .status,main[data-tone=watch] .status,main[data-tone=over] .status,.usage strong,.forecast strong {
    color: var(--accent);
  }
</style>
</head>
<body>
<main id="content">
  <header>
    <div class="brand">
      <img class="brand-icon" src="${iconUri}" alt="" aria-hidden="true" width="40" height="40">
      <div>
        <p id="eyebrow" class="eyebrow"></p>
        <h1>Copilot Pace</h1>
      </div>
    </div>
    <div class="controls header-tools">
      ${__DEV__ ? '<span id="demo" class="badge">DEMO</span>' : ''}
      <button id="language"></button>
    </div>
  </header>

  <div class="hero">
    <div class="hero-top">
      <span id="period" class="muted"></span>
      <span id="summary" class="status"></span>
    </div>
    <div class="usage">
      <strong id="percentage"></strong>
      <span id="budgetUsedLabel"></span>
    </div>
    <p class="used-of"><span id="used"></span> / <span id="total"></span></p>
    <div class="remaining">
      <span id="remainingLabel" class="muted"></span>
      <strong id="remaining"></strong>
    </div>
    <p id="message" class="muted" role="status" aria-live="polite"></p>
  </div>

  <section aria-labelledby="progressHeading">
    <div class="section-head">
      <h2 id="progressHeading"></h2>
      <span id="daysLeft"></span>
    </div>
    <div class="progress-row">
      <label id="usageBarLabel" for="usageBar"></label>
      <progress id="usageBar" max="100"></progress>
      <strong id="usageLabel"></strong>
    </div>
    <div class="progress-row">
      <label id="cycleBarLabel" for="cycleBar"></label>
      <progress id="cycleBar" max="100"></progress>
      <strong id="cycleProgress"></strong>
    </div>
  </section>

  <section aria-labelledby="paceHeading">
    <div class="section-head">
      <h2 id="paceHeading"></h2>
      <div id="days" class="controls days" role="group">
        <button id="all" aria-pressed="false"></button>
        <button id="weekdays" aria-pressed="false"></button>
      </div>
    </div>
    <div class="metrics">
      <div class="metric">
        <span id="averageHeading"></span>
        <strong id="dailyAverage"></strong>
        <small id="averageHint"></small>
      </div>
      <div class="metric">
        <span id="allowanceHeading"></span>
        <strong id="allowance"></strong>
        <small id="allowanceHint"></small>
      </div>
    </div>
    <div class="forecast">
      <span id="projectionLabel"></span>
      <strong id="projection"></strong>
    </div>
    <div class="metrics forecast-metrics">
      <div class="metric">
        <span id="depletionHeading"></span>
        <strong id="depletion"></strong>
      </div>
      <div class="metric">
        <span id="excessHeading"></span>
        <strong id="excess"></strong>
      </div>
    </div>
    <p id="forecastHint" class="explanation"></p>
    <p class="explanation"><span id="baselinePrefix"></span> <span id="baseRate"></span>. <span id="calendarNote"></span></p>
  </section>

  <section aria-labelledby="historyHeading">
    <div class="section-head">
      <h2 id="historyHeading"></h2>
      <span id="historyMaximum"></span>
    </div>
    <div id="historyPlot">
    <svg id="historyChart" viewBox="0 0 584 192" role="img">
      <path class="chart-axis" d="M32 24V168H552"></path>
      <path id="historyBudget"></path>
      <g id="historyPoints"></g>
    </svg>
    <div class="chart-labels"><span id="historyStart"></span><span id="historyEnd"></span></div>
    </div>
    <p id="historyMessage" class="explanation" role="status"></p>
  </section>

  <footer>
    <dl>
      <dt id="accountHeading" hidden></dt><dd id="accountLabel" hidden></dd>
      <dt id="renewalHeading"></dt><dd id="renewal"></dd>
      <dt id="updatedHeading"></dt><dd id="updated"></dd>
    </dl>
    <div class="controls">
      <button id="refresh"></button>
      <button id="connect"></button>
    </div>
    <div class="controls appearance">
      <label id="statusStyleLabel" for="statusStyle"></label>
      <select id="statusStyle">
        <option id="styleText" value="text"></option>
        <option id="styleCompact" value="compact"></option>
        <option id="styleBar" value="bar"></option>
        <option id="styleDots" value="dots"></option>
      </select>
    </div>
    <p id="retry"></p>
    ${__DEV__ ? '<p id="demoNote"></p>' : ''}
  </footer>
</main>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
let currentLanguage;
function show(model) {
  currentLanguage = model.language;
  document.getElementById('page').setAttribute('lang', model.language);
  document.getElementById('content').setAttribute('data-tone', model.tone);

  const labelIds = [
    'eyebrow', 'budgetUsedLabel', 'remainingLabel', 'progressHeading',
    'usageBarLabel', 'cycleBarLabel', 'paceHeading', 'all', 'weekdays',
    'averageHeading', 'averageHint', 'allowanceHeading', 'allowanceHint',
    'projectionLabel', 'baselinePrefix', 'calendarNote', 'accountHeading',
    'renewalHeading', 'updatedHeading', 'refresh',
    'depletionHeading', 'excessHeading', 'forecastHint', 'historyHeading',
    'statusStyleLabel', 'styleText', 'styleCompact', 'styleBar', 'styleDots',
  ];
  for (const id of labelIds) {
    document.getElementById(id).textContent = model.text[id];
  }
  document.getElementById('days').setAttribute('aria-label', model.text.daysAria);
  document.getElementById('language').textContent = model.text.switchLanguage;
  document.getElementById('language').setAttribute('aria-label', model.text.switchLanguageAria);

  const valueIds = [
    'summary', 'message', 'used', 'total', 'percentage', 'remaining', 'renewal',
    'dailyAverage', 'allowance', 'projection', 'updated', 'retry',
    'cycleProgress', 'daysLeft', 'period', 'baseRate', 'accountLabel',
    'depletion', 'excess', 'historyMaximum', 'historyStart', 'historyEnd', 'historyMessage',
  ];
  for (const id of valueIds) {
    document.getElementById(id).textContent = model[id];
  }
  document.getElementById('statusStyle').value = model.statusStyle;
  const chart = document.getElementById('historyChart');
  document.getElementById('historyPlot').hidden = model.history.length === 0;
  chart.setAttribute('aria-label', model.text.historyAria);
  document.getElementById('historyBudget').setAttribute('d', model.historyBudget.map((point, index) => (index === 0 ? 'M' : 'L') + point.x + ' ' + point.y).join(''));
  const points = document.getElementById('historyPoints');
  points.replaceChildren();
  for (let index = 0; index < model.history.length; index++) {
    const point = model.history[index];
    const previous = model.history[index - 1];
    if (point.connect && previous) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('d', 'M' + previous.x + ' ' + previous.y + 'L' + point.x + ' ' + point.y);
      line.setAttribute('fill', 'none');
      points.appendChild(line);
    }
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', String(point.x));
    dot.setAttribute('cy', String(point.y));
    dot.setAttribute('r', '2.5');
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = point.label;
    dot.appendChild(title);
    points.appendChild(dot);
  }
  ${__DEV__ ? `document.getElementById('demo').hidden = !model.demo;
  const note = document.getElementById('demoNote');
  note.hidden = !model.demo;
  note.textContent = model.text.simulatedData + ' · ' + model.scenario + ' · ' + model.text.asOf + ' ' + model.referenceDate;` : ''}

  document.getElementById('usageLabel').textContent = model.percentage;
  for (const [id, value] of [['usageBar', model.usageValue], ['cycleBar', model.cycleValue]]) {
    const bar = document.getElementById(id);
    bar.value = value === null ? 0 : Math.min(100, Math.max(0, value));
    const percentage = id === 'usageBar' ? model.percentage : model.cycleProgress;
    const description = value === null ? model.text.unavailable
      : percentage.replace('%', model.text.percentAria).replace('<', model.text.lessThan);
    bar.setAttribute('aria-valuetext', description);
  }
  document.getElementById('connect').hidden = !model.canConnect;
  document.getElementById('connect').textContent = model.connectLabel;
  for (const id of ['accountHeading', 'accountLabel']) {
    document.getElementById(id).hidden = !model.accountLabel;
  }
  document.getElementById('refresh').disabled = model.busy;
  document.getElementById('connect').disabled = model.busy;
  for (const mode of ['all', 'weekdays']) {
    document.getElementById(mode).setAttribute('aria-pressed', String(model.dayMode === mode));
  }
}
show(${initial});
window.addEventListener('message', event => {
  if (event.data && event.data.type === 'state') show(event.data.model);
});
document.getElementById('refresh').addEventListener('click', () => vscode.postMessage({ action: 'refresh' }));
document.getElementById('connect').addEventListener('click', () => vscode.postMessage({ action: 'connect' }));
document.getElementById('language').addEventListener('click', () => {
  vscode.postMessage({ action: 'language', value: currentLanguage === 'en' ? 'es-ES' : 'en' });
});
document.getElementById('statusStyle').addEventListener('change', event => {
  vscode.postMessage({ action: 'statusStyle', value: event.target.value });
});
for (const mode of ['all', 'weekdays']) {
  document.getElementById(mode).addEventListener('click', () => vscode.postMessage({ action: 'dayMode', value: mode }));
}
vscode.postMessage({ action: 'ready' });
</script>
</body>
</html>`;
}
