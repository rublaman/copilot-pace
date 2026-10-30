export type ChartStyle = 'line' | 'columns';
export type ChartMetric = 'cumulative' | 'daily';
export type ChartTone = 'good' | 'over' | 'neutral';

const left = 32;
const top = 24;
const width = 520;
const height = 144;
export const chartLayout = {
  left, top, width, height,
  right: left + width, bottom: top + height,
  svgWidth: 584, svgHeight: 224, clipBottom: 192,
};

export function chartTone(used: number, budget: number | undefined): ChartTone {
  if (budget === undefined) return 'neutral';
  return used > budget + 1e-9 ? 'over' : 'good';
}

export function resolveChartMetric(value: unknown): ChartMetric {
  return value === 'daily' ? value : 'cumulative';
}

export function resolveChartStyle(value: unknown): ChartStyle {
  return value === 'columns' ? value : 'line';
}
