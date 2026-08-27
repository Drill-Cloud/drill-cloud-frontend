import type { CSSProperties } from 'react';
import type { CurrentItem } from '../entities/current/types';
import { formatNumber } from '../utils/format';

type MetricGaugeWidgetProps = {
  item: CurrentItem;
};

type GaugeStyle = CSSProperties & {
  '--gauge-color': string;
  '--gauge-progress': string;
};

/** Возвращает положение значения внутри диапазона от 0 до 1. */
function getGaugeProgress(item: CurrentItem): number | null {
  if (item.value === null || item.min === null || item.max === null || item.max <= item.min) {
    return null;
  }

  return Math.min(1, Math.max(0, (item.value - item.min) / (item.max - item.min)));
}

/** Показывает текущее значение относительно настроенного диапазона тега. */
export function MetricGaugeWidget({ item }: MetricGaugeWidgetProps) {
  const name = item.name?.trim() || item.tag;
  const unit = item.unitOfMeasurement?.trim();
  const progress = getGaugeProgress(item);
  const color = item.color ?? '#94A3B8';
  const style: GaugeStyle = {
    '--gauge-color': color,
    '--gauge-progress': `${(progress ?? 0) * 360}deg`,
  };

  return (
    <article className="metric-gauge-widget" style={style} data-testid="metric-gauge-widget" data-tag={item.tag}>
      <header className="metric-gauge-widget__header">
        <span>{name}</span>
        <small>{item.tag}</small>
      </header>

      <div className={`metric-gauge-widget__gauge ${progress === null ? 'is-unavailable' : ''}`}>
        <div className="metric-gauge-widget__reading">
          <strong>{formatNumber(item.value)}</strong>
          {unit ? <span>{unit}</span> : null}
        </div>
      </div>

      <footer className="metric-gauge-widget__range">
        <span>{formatNumber(item.min)}</span>
        <strong>{progress === null ? 'диапазон не задан' : `${Math.round(progress * 100)}%`}</strong>
        <span>{formatNumber(item.max)}</span>
      </footer>
    </article>
  );
}
