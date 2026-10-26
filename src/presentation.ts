import type { ViewModel } from './view';
import { chartLayout } from './chart';
import webviewScript from 'copilot-pace:webview';
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
    flex-wrap: wrap;
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
          <svg id="historyChart" viewBox="0 0 ${chartLayout.svgWidth} ${chartLayout.svgHeight}" preserveAspectRatio="none" role="img">
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
            <path class="chart-grid" d="${[0, 1, 2].map(step => `M${chartLayout.left} ${chartLayout.top + step * chartLayout.height / 3}H${chartLayout.right}`).join('')}"></path>
            <path class="chart-axis" d="M${chartLayout.left} ${chartLayout.bottom}H${chartLayout.right}"></path>
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
const initialModel = ${initial};
${webviewScript}
</script>
</body>
</html>`;
}
