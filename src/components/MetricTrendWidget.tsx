import type { CSSProperties } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { CurrentItem } from '../entities/current/types';
import { formatNumber } from '../utils/format';

type MetricTrendWidgetProps = {
  item: CurrentItem;
  values: number[];
};

type TrendStyle = CSSProperties & {
  '--trend-color': string;
};

/** Преобразует последние значения в точки компактного SVG-графика. */
function buildSparkline(values: number[]): string {
  const points = values.filter(Number.isFinite);
  if (points.length < 2) {
    return '0,32 220,32';
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  return points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 220;
      const y = 58 - ((value - min) / range) * 52;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** Показывает текущее значение и направление изменения по последним точкам. */
export function MetricTrendWidget({ item, values }: MetricTrendWidgetProps) {
  const name = item.name?.trim() || item.tag;
  const unit = item.unitOfMeasurement?.trim();
  const first = values.at(0);
  const last = values.at(-1);
  const delta = first === undefined || last === undefined ? null : last - first;
  const deltaPercent = delta === null || first === 0 || first === undefined ? null : (delta / Math.abs(first)) * 100;
  const direction = delta === null || delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down';
  const DirectionIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : ArrowRight;
  const style: TrendStyle = { '--trend-color': item.color ?? '#94A3B8' };

  return (
    <article className="metric-trend-widget" style={style} data-testid="metric-trend-widget" data-tag={item.tag}>
      <header className="metric-trend-widget__header">
        <div>
          <span>{name}</span>
          <small>{item.tag}</small>
        </div>
        <span className={`metric-trend-widget__delta is-${direction}`}>
          <DirectionIcon size={16} />
          {deltaPercent === null ? 'нет динамики' : `${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1)}%`}
        </span>
      </header>

      <div className="metric-trend-widget__reading">
        <strong>{formatNumber(item.value)}</strong>
        {unit ? <span>{unit}</span> : null}
      </div>

      <svg className="metric-trend-widget__chart" viewBox="0 0 220 64" role="img" aria-label={`Динамика показателя ${name}`}>
        <line x1="0" y1="58" x2="220" y2="58" />
        <polyline points={buildSparkline(values)} />
      </svg>

      <footer>
        <span>Последние {values.length} точек</span>
        <span>{delta === null ? '—' : `${delta > 0 ? '+' : ''}${formatNumber(delta)}${unit ? ` ${unit}` : ''}`}</span>
      </footer>
    </article>
  );
}
