export const WEEK = [
  { code: 'MO', short: 'L', name: 'lun' },
  { code: 'TU', short: 'M', name: 'mar' },
  { code: 'WE', short: 'X', name: 'mié' },
  { code: 'TH', short: 'J', name: 'jue' },
  { code: 'FR', short: 'V', name: 'vie' },
  { code: 'SA', short: 'S', name: 'sáb' },
  { code: 'SU', short: 'D', name: 'dom' },
] as const;

export type RepeatMode = 'once' | 'daily' | 'weekly';

export function buildRule(mode: RepeatMode, days: string[]): string | undefined {
  if (mode === 'daily') return 'FREQ=DAILY';
  if (mode === 'weekly') {
    const ordered = WEEK.map((d) => d.code).filter((code) => days.includes(code));
    return `FREQ=WEEKLY;BYDAY=${ordered.join(',')}`;
  }
  return undefined;
}

export function describeRule(rule: string | null | undefined): string | null {
  if (!rule) return null;
  if (rule === 'FREQ=DAILY') return 'Cada día';
  const match = /BYDAY=([A-Z,]+)/.exec(rule);
  if (!match) return 'Cada semana';
  const codes = match[1].split(',');
  if (codes.length === 7) return 'Cada día';
  const text = WEEK.filter((d) => codes.includes(d.code))
    .map((d) => d.name)
    .join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}