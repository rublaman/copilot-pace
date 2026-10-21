export type ChartStyle = 'area' | 'line' | 'columns';

export function resolveChartStyle(value: unknown): ChartStyle {
  return value === 'line' || value === 'columns' ? value : 'area';
}
