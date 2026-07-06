import type { CurrentItem } from '../entities/current/types';

export type MetricStatus = 'normal' | 'warning' | 'critical';

export type MetricStatusInfo = {
  status: MetricStatus;
  label: string;
  ageSeconds: number;
};

function isConfiguredLimit(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Классифицирует показатель по уставкам min/max из справочника tag. */
export function getMetricStatus(item: CurrentItem, now = Date.now()): MetricStatusInfo {
  const measuredAt = new Date(item.time).getTime();
  const ageSeconds = Number.isFinite(measuredAt) ? Math.max(0, Math.round((now - measuredAt) / 1000)) : Number.POSITIVE_INFINITY;
  const value = item.value;
  const belowMin = isConfiguredLimit(value) && isConfiguredLimit(item.min) && value < item.min;
  const aboveMax = isConfiguredLimit(value) && isConfiguredLimit(item.max) && value > item.max;

  if (belowMin || aboveMax) {
    return { status: 'critical', label: 'за пределами уставки', ageSeconds };
  }

  return { status: 'normal', label: 'норма', ageSeconds };
}
