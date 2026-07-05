import type { CurrentItem } from '../entities/current/types';
import { formatNumber } from '../utils/format';

type MetricWidgetProps = {
  item: CurrentItem;
};

export function MetricWidget({ item }: MetricWidgetProps) {
  const name = item.name?.trim() || item.tag;
  const unit = item.unitOfMeasurement?.trim();

  return (
    <article className="metric-widget" title={`${name} (${item.tag})`}>
      <span className="metric-widget__id">{item.tag}</span>
      <span className="metric-widget__name">{name}</span>
      <span className="metric-widget__reading">
        <strong className="metric-widget__value">{formatNumber(item.value)}</strong>
        {unit ? <span className="metric-widget__unit">{unit}</span> : null}
      </span>
    </article>
  );
}
