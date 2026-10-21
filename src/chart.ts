export type ChartStyle = 'area' | 'line' | 'columns';
export type ChartMetric = 'cumulative' | 'daily';
export type ChartTone = 'good' | 'over' | 'neutral';

export function chartTone(used: number, budget: number | undefined): ChartTone {
  if (budget === undefined) return 'neutral';
  return used > budget + 1e-9 ? 'over' : 'good';
}

export function resolveChartMetric(value: unknown): ChartMetric {
  return value === 'daily' ? value : 'cumulative';
}

export function resolveChartStyle(value: unknown): ChartStyle {
  return value === 'line' || value === 'columns' ? value : 'area';
}
