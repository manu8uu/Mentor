import type { GoalSummary } from './api';
import type { Theme } from '../theme';

export const percent = (ratio: number) => Math.min(Math.round(ratio * 100), 100);

export function deadlineText(daysLeft: number | null): string {
  if (daysLeft === null) return 'Sin fecha límite';
  if (daysLeft === 0) return 'Vence hoy';
  if (daysLeft === 1) return 'Queda 1 día';
  if (daysLeft > 1) return `Quedan ${daysLeft} días`;
  return daysLeft === -1 ? 'Venció ayer' : `Venció hace ${-daysLeft} días`;
}

export function paceInfo(pace: GoalSummary['pace'], c: Theme) {
  switch (pace) {
    case 'ON_TRACK':
      return { label: 'Buen ritmo', color: c.done };
    case 'IRREGULAR':
      return { label: 'Irregular', color: c.accent };
    case 'BEHIND':
      return { label: 'Por detrás', color: c.danger };
    default:
      return { label: 'Empezando', color: c.muted };
  }
}