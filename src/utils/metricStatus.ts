import type { CurrentItem } from '../api/cloud';

export type MetricStatus = 'normal' | 'warning' | 'critical';

export type MetricStatusInfo = {
  status: MetricStatus;
  label: string;
  ageSeconds: number;
};

/** Классифицирует показатель по свежести данных до подключения реальных аварийных правил. */
export function getMetricStatus(item: CurrentItem, now = Date.now()): MetricStatusInfo {
  const measuredAt = new Date(item.time).getTime();
  const ageSeconds = Number.isFinite(measuredAt) ? Math.max(0, Math.round((now - measuredAt) / 1000)) : Number.POSITIVE_INFINITY;

  if (ageSeconds > 300) {
    return { status: 'critical', label: 'нет связи', ageSeconds };
  }

  if (ageSeconds > 30) {
    return { status: 'warning', label: 'устарело', ageSeconds };
  }

  return { status: 'normal', label: 'норма', ageSeconds };
}
