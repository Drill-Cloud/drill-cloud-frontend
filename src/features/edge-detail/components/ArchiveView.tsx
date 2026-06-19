import { useState } from 'react';
import { CalendarClock, ChevronDown, DatabaseZap, Search } from 'lucide-react';
import type { CurrentItem } from '../../../entities/current/types';
import type { HistoryResponse } from '../../../entities/history/types';
import { HistoryChart } from '../../../features/history-chart/HistoryChart';
import { RANGE_PRESETS, createRange, type DateRangeState } from '../../../features/history/dateRange';
import { toIsoFromInput } from '../../../utils/format';
import type { HistoryGranularity } from '../../../utils/historyGranularity';

type ArchiveViewProps = {
  getTagLabel: (tag: string) => string;
  history?: HistoryResponse;
  historyAxis: HistoryGranularity;
  historyGranulate?: string;
  historyLoading: boolean;
  items: CurrentItem[];
  range: DateRangeState;
  search: string;
  selectedTags: string[];
  tagLabels: Record<string, string>;
  onClearTags: () => void;
  onClearVisibleTags: () => void;
  onRangeChange: (value: DateRangeState) => void;
  onSearchChange: (value: string) => void;
  onSelectFirstTags: () => void;
  onSelectVisibleTags: () => void;
  onToggleTag: (tag: string) => void;
};

export function ArchiveView({
  getTagLabel,
  history,
  historyAxis,
  historyGranulate,
  historyLoading,
  items,
  range,
  search,
  selectedTags,
  tagLabels,
  onClearTags,
  onClearVisibleTags,
  onRangeChange,
  onSearchChange,
  onSelectFirstTags,
  onSelectVisibleTags,
  onToggleTag,
}: ArchiveViewProps) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const selectedPreview = selectedTags.slice(0, 10);
  const hiddenSelectedCount = Math.max(0, selectedTags.length - selectedPreview.length);

  return (
    <section className="chart-section chart-section--archive">
      <div className="section-header">
        <div>
          <span className="page-kicker">
            <CalendarClock size={14} />
            История
          </span>
          <h2>График параметров</h2>
        </div>
        <div className="source-chip">
          <DatabaseZap size={16} />
          cloud-v3 · {historyGranulate ?? 'ожидание'}
        </div>
      </div>

      <div className="archive-tag-panel">
        <button
          type="button"
          className="archive-tag-panel__toggle"
          onClick={() => setSelectorOpen((open) => !open)}
          aria-expanded={selectorOpen}
        >
          <span>
            Показатели
            <strong>
              {selectedTags.length} выбрано · {items.length} найдено
            </strong>
          </span>
          <ChevronDown size={18} />
        </button>

        {selectorOpen ? (
          <div className="tag-selector">
            <div className="tag-selector__header">
              <label className="search-box">
                <Search size={16} />
                <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Поиск" />
              </label>
              <div className="tag-selector__tools">
                <button type="button" onClick={onSelectFirstTags}>
                  Первый
                </button>
                <button type="button" onClick={onSelectVisibleTags}>
                  Выбрать найденный
                </button>
                <button type="button" onClick={onClearVisibleTags}>
                  Снять найденные
                </button>
                <button type="button" onClick={onClearTags}>
                  Сбросить все
                </button>
              </div>
            </div>

            <div className="selected-tags">
              {selectedPreview.length ? (
                selectedPreview.map((tag) => <span key={tag}>{getTagLabel(tag)}</span>)
              ) : (
                <span>Не выбрано</span>
              )}
              {hiddenSelectedCount > 0 ? <span>+{hiddenSelectedCount}</span> : null}
            </div>

            <div className="tag-select-list">
              {items.map((item) => {
                const selected = selectedTags.includes(item.tag);
                const label = getTagLabel(item.tag);
                return (
                  <button
                    key={item.tag}
                    type="button"
                    className={`tag-select-item ${selected ? 'tag-select-item--selected' : ''}`}
                    title={item.tag}
                    onClick={() => onToggleTag(item.tag)}
                  >
                    <span className="tag-select-item__name">
                      <span>{label}</span>
                      {label !== item.tag ? <small>{item.tag}</small> : null}
                    </span>
                    <strong>{item.value.toLocaleString('ru-RU', { maximumFractionDigits: item.precision ?? 3 })}</strong>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="archive-chart">
        <div className="toolbar">
          <div className="segmented">
            {RANGE_PRESETS.map((preset) => (
              <button key={preset.id} type="button" onClick={() => onRangeChange(createRange(preset.hours))}>
                {preset.label}
              </button>
            ))}
          </div>
          <label>
            С
            <input
              type="datetime-local"
              value={range.from}
              onChange={(event) => onRangeChange({ ...range, from: event.target.value })}
            />
          </label>
          <label>
            По
            <input
              type="datetime-local"
              value={range.to}
              onChange={(event) => onRangeChange({ ...range, to: event.target.value })}
            />
          </label>
        </div>

        {selectedTags.length ? (
          <HistoryChart
            key={`${range.from}:${range.to}:${selectedTags.join(',')}`}
            data={history}
            loading={historyLoading}
            from={toIsoFromInput(range.from)}
            to={toIsoFromInput(range.to)}
            tickIntervalMs={historyAxis.tickIntervalMs}
            labelFormat={historyAxis.labelFormat}
            tagLabels={tagLabels}
          />
        ) : (
          <div className="chart-placeholder">Разверните список показателей и выберите серию для графика</div>
        )}
      </div>
    </section>
  );
}
