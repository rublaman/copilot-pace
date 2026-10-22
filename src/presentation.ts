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

  .customization {
    border-top: 1px solid var(--line);
    padding-top: 18px;
  }

  .customization-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 12px;
    font-size: 12px;
  }

  .customization-row label,.customization-row > span {
    color: var(--muted);
  }

  #historyChart {
    width: 100%;
    height: 160px;
    display: block;
    overflow: visible;
  }

  .history-card {
    container-type: inline-size;
    --chart-accent: var(--vscode-charts-blue,#3794ff);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 18px 16px 14px;
  }

  .good {
    --chart-accent: var(--vscode-charts-green,#73c991);
  }

  .over {
    --chart-accent: var(--vscode-charts-red,#f48771);
  }

  #historyLatest[data-chart-tone=good] {
    color: var(--vscode-charts-green,#73c991);
  }

  #historyLatest[data-chart-tone=over] {
    color: var(--vscode-charts-red,#f48771);
  }

  .chart-summary {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  #chartMetrics {
    margin-bottom: 12px;
  }

  .chart-summary p {
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 4px;
  }

  .chart-summary strong {
    font-size: 24px;
    font-weight: 550;
    letter-spacing: -.5px;
    font-variant-numeric: tabular-nums;
  }

  .chart-style-tag {
    color: var(--muted);
    border: 1px solid var(--line);
    border-radius: 20px;
    font-size: 10px;
    padding: 3px 9px;
    white-space: nowrap;
  }

  .chart-grid {
    fill: none;
    stroke: var(--line);
    stroke-dasharray: 2 5;
    stroke-opacity: .55;
  }

  .chart-axis {
    fill: none;
    stroke: var(--line);
  }

  #historyBudget,#historyBudgetLeader {
    fill: none;
    stroke: var(--muted);
    stroke-dasharray: 5 5;
    stroke-width: 1.2;
  }

  .chart-line {
    fill: none;
    stroke: var(--chart-accent);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .chart-dot {
    fill: var(--chart-accent);
    stroke: var(--surface);
    stroke-width: 2;
  }

  .chart-dot.partial {
    fill: var(--surface);
    stroke: var(--chart-accent);
    stroke-dasharray: 2 2;
  }

  .chart-last {
    fill: var(--surface);
    stroke: var(--chart-accent);
    stroke-width: 2.5;
  }

  .chart-column {
    fill: url(#historyColumnFill);
  }

  .chart-column.good {
    fill: url(#historyColumnFillGood);
  }

  .chart-column.over {
    fill: url(#historyColumnFillOver);
  }

  .chart-column.partial {
    fill-opacity: .6;
    stroke: var(--chart-accent);
    stroke-dasharray: 3 3;
  }

  .chart-column:hover,.chart-column:focus-visible {
    fill: var(--chart-accent);
    outline: none;
  }

  .chart-column-top {
    stop-color: var(--chart-accent);
    stop-opacity: .95;
  }

  .chart-column-bottom {
    stop-color: var(--chart-accent);
    stop-opacity: .35;
  }

  .chart-legend {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 18px;
    margin-top: 16px;
    color: var(--muted);
    font-size: 11px;
  }

  .chart-legend span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .chart-legend span::before {
    content: '';
    width: 16px;
    border-top: 2px solid var(--chart-accent);
  }

  .chart-legend .budget-key::before {
    border-top: 2px dashed var(--muted);
  }

  .chart-legend .good-key::before {
    border-color: var(--vscode-charts-green,#73c991);
  }

  .chart-legend .over-key::before {
    border-color: var(--vscode-charts-red,#f48771);
  }

  .chart-labels {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 11px;
    color: var(--muted);
  }

  .chart-body {
    display: grid;
    grid-template-columns: minmax(0,1fr) 105px;
  }

  .chart-body:has(.chart-target-content[hidden]) {
    grid-template-columns: minmax(0,1fr) 0;
  }

  .chart-target {
    position: relative;
    color: var(--muted);
    font-size: 10px;
    min-width: 0;
  }

  .chart-target-content {
    position: absolute;
    transform: translateY(-50%);
    padding-left: 8px;
  }

  .chart-target strong {
    display: block;
    color: var(--vscode-foreground);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .chart-plot {
    position: relative;
  }

  .chart-calendar-label {
    position: absolute;
    top: 85%;
    color: var(--muted);
    font-size: 10px;
    white-space: nowrap;
    transform: translateX(-50%) rotate(-40deg);
  }

  #historyCalendarMarks path {
    stroke: var(--muted);
    stroke-opacity: .6;
  }

  @container (max-width:360px) {
    .chart-calendar-label.monday {
      top: 105%;
    }
    .chart-body {
      grid-template-columns: minmax(0,1fr) 85px;
    }
    .chart-body:has(.chart-calendar-label.monday) {
      margin-bottom: 32px;
    }
  }

  .history-file {
    margin-top: 18px;
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
    ${__DEV__ ? '<div class="controls header-tools"><span id="demo" class="badge">DEMO</span></div>' : ''}
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
    <p id="projectionHint" class="explanation"></p>
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
    <div id="chartMetrics" class="controls days" role="group">
      <button id="metricCumulative" aria-pressed="false"></button>
      <button id="metricDaily" aria-pressed="false"></button>
    </div>
    <div id="historyPlot" class="history-card">
      <div class="chart-summary">
        <div>
          <p id="historyMetricLabel"></p>
          <strong id="historyLatest"></strong>
          <p id="historyLatestDate"></p>
        </div>
        <span id="chartStyleName" class="chart-style-tag"></span>
      </div>
      <div class="chart-body">
        <div class="chart-plot">
          <svg id="historyChart" viewBox="0 0 584 224" preserveAspectRatio="none" role="img">
            <defs>
              <clipPath id="historyWithinClip"><path id="historyWithinClipShape"></path></clipPath>
              <clipPath id="historyOverClip"><path id="historyOverClipShape"></path></clipPath>
              <linearGradient id="historyColumnFill" x1="0" y1="0" x2="0" y2="1">
                <stop class="chart-column-top" offset="0%"></stop>
                <stop class="chart-column-bottom" offset="100%"></stop>
              </linearGradient>
              <linearGradient id="historyColumnFillGood" class="good" x1="0" y1="0" x2="0" y2="1">
                <stop class="chart-column-top" offset="0%"></stop>
                <stop class="chart-column-bottom" offset="100%"></stop>
              </linearGradient>
              <linearGradient id="historyColumnFillOver" class="over" x1="0" y1="0" x2="0" y2="1">
                <stop class="chart-column-top" offset="0%"></stop>
                <stop class="chart-column-bottom" offset="100%"></stop>
              </linearGradient>
            </defs>
            <path class="chart-grid" d="M32 24H552M32 72H552M32 120H552"></path>
            <path class="chart-axis" d="M32 168H552"></path>
            <g id="historyPoints"></g>
            <path id="historyBudget"></path>
            <path id="historyBudgetLeader"></path>
            <g id="historyCalendarMarks"></g>
          </svg>
          <div id="historyCalendarTicks"></div>
        </div>
        <div class="chart-target">
          <div id="historyBudgetTargetPosition" class="chart-target-content">
            <strong id="historyBudgetTarget"></strong>
            <span id="historyBudgetTargetHint"></span>
          </div>
        </div>
      </div>
      <div class="chart-labels"><span id="historyStart"></span><span id="historyEnd"></span></div>
      <div class="chart-legend">
        <span id="historyObservedLabel"></span>
        <span id="historyWithinLabel" class="good-key"></span>
        <span id="historyOverLabel" class="over-key"></span>
        <span id="historyBudgetLabel" class="budget-key"></span>
      </div>
      <p id="historyColumnsNote" class="explanation" hidden></p>
    </div>
    <p id="historyMessage" class="explanation" role="status"></p>
  </section>

  <section class="customization" aria-labelledby="customizationHeading">
    <h2 id="customizationHeading"></h2>
    <div class="customization-row">
      <label id="languageLabel" for="language"></label>
      <button id="language"></button>
    </div>
    <div class="customization-row">
      <label id="statusStyleLabel" for="statusStyle"></label>
      <select id="statusStyle">
        <option id="styleText" value="text"></option>
        <option id="styleCompact" value="compact"></option>
        <option id="styleBar" value="bar"></option>
        <option id="styleDots" value="dots"></option>
      </select>
    </div>
    <div class="customization-row">
      <label id="chartStyleLabel" for="chartStyle"></label>
      <select id="chartStyle">
        <option id="chartLine" value="line"></option>
        <option id="chartColumns" value="columns"></option>
      </select>
    </div>
    <div id="historyFile" class="history-file" hidden>
      <div class="customization-row">
        <span id="historyFileLabel"></span>
        <div class="controls" role="group" aria-labelledby="historyFileLabel">
          <button id="revealHistory"></button>
          <button id="openHistory"></button>
        </div>
      </div>
      <p id="historyFileNote" class="explanation"></p>
    </div>
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
    <p id="retry"></p>
    ${__DEV__ ? '<p id="demoNote"></p>' : ''}
  </footer>
</main>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
let currentLanguage;
function drawHistory(model) {
  const layer = document.getElementById('historyPoints');
  layer.replaceChildren();
  const create = (tag, attributes, label) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    if (label) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = label;
      element.appendChild(title);
    }
    layer.appendChild(element);
  };
  const drawPath = (path, className) => {
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
        x: point.x - 5, y: point.y, width: 10, height: Math.max(.5, 168 - point.y),
        rx: 3, class: 'chart-column ' + point.tone + (point.partial ? ' partial' : ''), tabindex: 0, 'aria-label': point.label,
      }, point.label);
    }
    return;
  }
  const segments = [];
  for (const point of model.history) {
    if (!point.connect || segments.length === 0) segments.push([]);
    segments[segments.length - 1].push(point);
  }
  for (const segment of segments) {
    const first = segment[0];
    const last = segment[segment.length - 1];
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
function drawCalendarTicks(model) {
  const layer = document.getElementById('historyCalendarTicks');
  const marks = document.getElementById('historyCalendarMarks');
  layer.replaceChildren();
  marks.replaceChildren();
  for (const tick of model.historyCalendarTicks) {
    const mark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mark.setAttribute('d', 'M' + tick.x + ' 168v7');
    marks.appendChild(mark);
    const label = document.createElement('span');
    label.setAttribute('class', 'chart-calendar-label' + (tick.weekend ? '' : ' monday'));
    label.style.left = (tick.x / 584 * 100) + '%';
    label.textContent = tick.label;
    layer.appendChild(label);
  }
}
function show(model) {
  currentLanguage = model.language;
  document.getElementById('page').setAttribute('lang', model.language);
  document.getElementById('content').setAttribute('data-tone', model.tone);

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
    'historyLatest', 'chartStyleName', 'historyMetricLabel', 'historyLatestDate',
    'historyBudgetTarget', 'historyBudgetTargetHint',
  ];
  for (const id of valueIds) {
    document.getElementById(id).textContent = model[id];
  }
  document.getElementById('statusStyle').value = model.statusStyle;
  document.getElementById('chartStyle').value = model.chartStyle;
  document.getElementById('historyFile').hidden = !model.showHistoryFile;
  document.getElementById('openHistory').disabled = !model.canOpenHistory;
  document.getElementById('revealHistory').disabled = !model.canOpenHistory;
  let fileNote = model.text.historyFileEmpty;
  if (model.demo) fileNote = model.text.historyDemo;
  else if (model.canOpenHistory) fileNote = model.text.historyFileNote;
  document.getElementById('historyFileNote').textContent = fileNote;
  const chart = document.getElementById('historyChart');
  document.getElementById('historyPlot').hidden = model.history.length === 0;
  chart.setAttribute('aria-label', model.historyAria);
  chart.setAttribute('role', model.chartMetric === 'daily' ? 'group' : 'img');
  const budgetPath = model.historyBudget.map((point, index) => (index === 0 ? 'M' : 'L') + point.x + ' ' + point.y).join('');
  document.getElementById('historyBudget').setAttribute('d', budgetPath);
  const target = document.getElementById('historyBudgetTargetPosition');
  target.hidden = !model.historyBudgetTarget;
  target.style.top = (model.historyBudgetTargetY / 224 * 100) + '%';
  document.getElementById('historyBudgetLeader').setAttribute('d', model.historyBudgetTarget ? 'M552 ' + model.historyBudgetTargetY + 'H584' : '');
  document.getElementById('historyWithinClipShape').setAttribute('d', budgetPath ? budgetPath + 'L552 192L32 192Z' : '');
  document.getElementById('historyOverClipShape').setAttribute('d', budgetPath ? budgetPath + 'L552 0L32 0Z' : '');
  document.getElementById('historyLatest').setAttribute('data-chart-tone', model.historyLatestTone);
  document.getElementById('historyObservedLabel').hidden = model.historyBudget.length > 0;
  document.getElementById('historyWithinLabel').hidden = model.historyBudget.length === 0;
  document.getElementById('historyOverLabel').hidden = model.historyBudget.length === 0;
  document.getElementById('historyBudgetLabel').hidden = model.historyBudget.length === 0;
  document.getElementById('historyColumnsNote').hidden = model.chartStyle !== 'columns' || model.chartMetric === 'daily';
  document.getElementById('chartMetrics').setAttribute('aria-label', model.text.chartMetricAria);
  document.getElementById('metricCumulative').setAttribute('aria-pressed', String(model.chartMetric === 'cumulative'));
  document.getElementById('metricDaily').setAttribute('aria-pressed', String(model.chartMetric === 'daily'));
  drawHistory(model);
  drawCalendarTicks(model);
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
document.getElementById('openHistory').addEventListener('click', () => vscode.postMessage({ action: 'openHistory' }));
document.getElementById('revealHistory').addEventListener('click', () => vscode.postMessage({ action: 'revealHistory' }));
document.getElementById('language').addEventListener('click', () => {
  vscode.postMessage({ action: 'language', value: currentLanguage === 'en' ? 'es-ES' : 'en' });
});
document.getElementById('statusStyle').addEventListener('change', event => {
  vscode.postMessage({ action: 'statusStyle', value: event.target.value });
});
document.getElementById('chartStyle').addEventListener('change', event => {
  vscode.postMessage({ action: 'chartStyle', value: event.target.value });
});
for (const mode of ['all', 'weekdays']) {
  document.getElementById(mode).addEventListener('click', () => vscode.postMessage({ action: 'dayMode', value: mode }));
}
for (const metric of ['Cumulative', 'Daily']) {
  document.getElementById('metric' + metric).addEventListener('click', () => vscode.postMessage({ action: 'chartMetric', value: metric.toLowerCase() }));
}
vscode.postMessage({ action: 'ready' });
</script>
</body>
</html>`;
}
