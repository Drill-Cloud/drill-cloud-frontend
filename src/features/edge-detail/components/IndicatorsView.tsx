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
