import { Search } from 'lucide-react';
import type { CurrentItem } from '../../../entities/current/types';
import { MetricWidget } from '../../../components/MetricWidget';
import { MetricWidgetsContainer } from '../../../components/MetricWidgetsContainer';
import { CurrentLiveChart } from '../../current/CurrentLiveChart';

type IndicatorsViewProps = {
  edgeId: string;
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
  edgeId,
  error,
  getTagLabel,
  isError,
  items,
  search,
  selectedTags,
  onSearchChange,
  onToggleTag,
}: IndicatorsViewProps) {
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
          <span>На графике</span>
          <strong>{selectedTags.length}</strong>
        </div>
      </div>

      {isError ? (
        <div className="empty-panel">Не удалось загрузить текущие значения: {String(error)}</div>
      ) : (
        <>
          {/* displayMode === 'overview' ? (
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
          ) */}
          <MetricWidgetsContainer>
            {items.map((item) => (
              <MetricWidget key={item.tag} item={item} />
            ))}
          </MetricWidgetsContainer>
          <CurrentLiveChart edgeId={edgeId} items={items} selectedTags={selectedTags} getTagLabel={getTagLabel} />
        </>
      )}
    </section>
  );
}
