import type { CurrentItem } from '../entities/current/types';
import { formatNumber } from '../utils/format';

type MetricWidgetProps = {
  item: CurrentItem;
};

export function MetricWidget({ item }: MetricWidgetProps) {
  const title = item.name?.trim() || item.tag;

  return (
    <article className="metric-widget" title={`${title} (${item.tag})`}>
      <span className="metric-widget__tag">{title}</span>
      <strong className="metric-widget__value">{formatNumber(item.value)}</strong>
    </article>
  );
}
