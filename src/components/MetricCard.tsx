import { Activity, Check, Clock3, Plus } from 'lucide-react';
import type { CurrentItem } from '../entities/current/types';
import { formatNumber } from '../utils/format';
import { getMetricStatus, type MetricStatusInfo } from '../utils/metricStatus';

type MetricCardProps = {
  item: CurrentItem;
  displayName?: string;
  selected: boolean;
  statusInfo?: MetricStatusInfo;
  onToggle: (tag: string) => void;
};

/** Показывает детальную карточку текущего показателя и управляет добавлением тега на график. */
export function MetricCard({ item, displayName, selected, statusInfo = getMetricStatus(item), onToggle }: MetricCardProps) {
  const { ageSeconds, label, status } = statusInfo;
  const ageLabel = ageSeconds < 60 ? `${ageSeconds}с` : `${Math.floor(ageSeconds / 60)}м ${ageSeconds % 60}с`;
  const title = displayName ?? item.tag;

  return (
    <button
      className={`metric-card metric-card--${status} ${selected ? 'metric-card--selected' : ''}`}
      type="button"
      onClick={() => onToggle(item.tag)}
      title={`${selected ? 'Убрать с графика' : 'Добавить на график'}: ${title}`}
    >
      <div className="metric-card__header">
        <span className="metric-card__signal">
          <Activity size={15} />
        </span>
        <span className="metric-card__tag">
          <span>{title}</span>
          {displayName && displayName !== item.tag ? <small>{item.tag}</small> : null}
        </span>
        <span className="metric-card__corner">
          <span className={`metric-card__state is-${status}`}>{label}</span>
          <span className="metric-card__age" title="Возраст последнего измерения">
            <Clock3 size={13} />
            {ageLabel}
          </span>
        </span>
      </div>

      <div className="metric-card__value">{formatNumber(item.value)}</div>

      <div className="metric-card__footer">
        <span className="metric-card__action">
          {selected ? <Check size={14} /> : <Plus size={14} />}
          {selected ? 'на графике' : 'на график'}
        </span>
      </div>
    </button>
  );
}
