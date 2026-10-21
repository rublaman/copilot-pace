export type StatusStyle = 'text' | 'compact' | 'bar' | 'dots';

export function resolveStatusStyle(value: unknown): StatusStyle {
  return value === 'compact' || value === 'bar' || value === 'dots' ? value : 'text';
}

export function statusText(style: StatusStyle, percentage: string, usedPercent: number | null, summary: string, neutral: boolean, demo: boolean): string {
  let text = summary;
  if (usedPercent !== null) {
    const fraction = Math.min(1, Math.max(0, usedPercent / 100));
    if (style === 'text') text = `${percentage} · ${summary}`;
    else if (style === 'compact') text = `$(github-copilot) ${percentage}`;
    else {
      const count = 8;
      const filled = fraction > 0 ? Math.max(1, Math.floor(fraction * count)) : 0;
      const on = style === 'bar' ? '▰' : '●';
      const off = style === 'bar' ? '▱' : '○';
      text = `${on.repeat(filled)}${off.repeat(count - filled)} ${percentage}`;
    }
    // Compact designs must still expose failures and pending estimates without hovering.
    if (style !== 'text' && neutral) text += ` · ${summary}`;
  }
  return text + (demo ? ' · Demo' : '');
}
