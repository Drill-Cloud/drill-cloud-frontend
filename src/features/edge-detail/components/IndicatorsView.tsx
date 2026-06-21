import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { CurrentItem } from '../../../entities/current/types';
import { MetricCard } from '../../../components/MetricCard';
import { formatNumber } from '../../../utils/format';
import { getMetricStatus } from '../../../utils/metricStatus';

type IndicatorsViewProps = {
  error: unknown;
  getTagLabel: (tag: string) => string;
  isError: boolean;
  items: CurrentItem[];
  search: string;
  selectedTags: string[];
  onSearchChange: (value: string) => void;
  onToggleTag: (tag: string) => void;
};

export function IndicatorsView({
  error,
  getTagLabel,
  isError,
  items,
  search,
  selectedTags,
  onSearchChange,
  onToggleTag,
}: IndicatorsViewProps) {
  const [displayMode, setDisplayMode] = useState<'overview' | 'cards'>('overview');
  const itemStatuses = useMemo(() => {
    const now = Date.now();
    return items.map((item) => ({ item, statusInfo: getMetricStatus(item, now) }));
  }, [items]);
  const statusCounts = itemStatuses.reduce(
    (counts, { statusInfo }) => {
      counts[statusInfo.status] += 1;
      return counts;
    },
    { normal: 0, warning: 0, critical: 0 },
  );

  return (
    <section className="tags-section">
      <div className="section-header">
        <div>
          <span className="page-kicker">
            <Search size={14} />
            Показатели
          </span>
          <h2>Текущие значения</h2>
        </div>
        <div className="indicator-controls">
          <div className="view-switch" aria-label="Режим отображения показателей">
            <button
              type="button"
              className={displayMode === 'overview' ? 'view-switch__button--active' : ''}
              onClick={() => setDisplayMode('overview')}
            >
              Картина
            </button>
            <button
              type="button"
              className={displayMode === 'cards' ? 'view-switch__button--active' : ''}
              onClick={() => setDisplayMode('cards')}
            >
              Карточки
            </button>
          </div>
          <label className="search-box">
            <Search size={16} />
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Поиск показателя" />
          </label>
        </div>
      </div>

      <div className="indicator-summary">
        <div>
          <span>Всего</span>
          <strong>{items.length}</strong>
        </div>
        <div>
          <span>В норме</span>
          <strong>{statusCounts.normal}</strong>
        </div>
        <div>
          <span>Предупреждение</span>
          <strong>{statusCounts.warning}</strong>
        </div>
        <div>
          <span>Критично</span>
          <strong>{statusCounts.critical}</strong>
        </div>
        <div>
          <span>На графике</span>
          <strong>{selectedTags.length}</strong>
        </div>
      </div>

      {isError ? (
        <div className="empty-panel">Не удалось загрузить текущие значения: {String(error)}</div>
      ) : displayMode === 'overview' ? (
        <div className="metric-mosaic">
          {itemStatuses.map(({ item, statusInfo }) => (
            <button
              key={`${item.edge}:${item.tag}`}
              type="button"
              className={`metric-tile metric-tile--${statusInfo.status} ${selectedTags.includes(item.tag) ? 'metric-tile--selected' : ''}`}
              title={`${getTagLabel(item.tag)} (${item.tag}): ${formatNumber(item.value)} · ${statusInfo.label}`}
              onClick={() => onToggleTag(item.tag)}
            >
              <span className="metric-tile__status" />
              <span className="metric-tile__tag">{getTagLabel(item.tag)}</span>
              <strong>{formatNumber(item.value)}</strong>
            </button>
          ))}
        </div>
      ) : (
        <div className="metric-grid">
          {itemStatuses.map(({ item, statusInfo }) => (
            <MetricCard
              key={`${item.edge}:${item.tag}`}
              item={item}
              displayName={getTagLabel(item.tag)}
              statusInfo={statusInfo}
              selected={selectedTags.includes(item.tag)}
              onToggle={onToggleTag}
            />
          ))}
        </div>
      )}
    </section>
  );
}
