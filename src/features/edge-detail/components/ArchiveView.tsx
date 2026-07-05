import { useState } from 'react';
import type { RefObject } from 'react';
import { useRef } from 'react';
import { CalendarDays, CalendarClock, Check, ChevronDown, Clock3, DatabaseZap, Search } from 'lucide-react';
import type { CurrentItem } from '../../../entities/current/types';
import { HistoryChart } from '../../../features/history-chart/HistoryChart';
import type { HistoryZoomRange } from '../../../features/history-chart/chartTypes';
import { RANGE_PRESETS, createRange, type DateRangeState } from '../../../features/history/dateRange';
import { toInputDateTimeValue, toIsoFromInput } from '../../../utils/format';
import type { HistoryGranularity } from '../../../utils/historyGranularity';

type ArchiveViewProps = {
  edgeId: string;
  getTagLabel: (tag: string) => string;
  historyAxis: HistoryGranularity;
  historyGranulate?: string;
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

type RangePart = 'from' | 'to';
type RangeInputPart = 'date' | 'time';

function getRangeInputPart(value: string, part: RangeInputPart): string {
  const [date = '', time = ''] = value.split('T');
  return part === 'date' ? date : time;
}

function updateRangeInputPart(value: string, part: RangeInputPart, nextValue: string): string {
  const date = getRangeInputPart(value, 'date');
  const time = getRangeInputPart(value, 'time');
  return part === 'date' ? `${nextValue}T${time}` : `${date}T${nextValue}`;
}

function openInputPicker(input: HTMLInputElement | null): void {
  input?.focus();
  input?.showPicker?.();
}

type DateRangeFieldProps = {
  icon: 'date' | 'time';
  inputRef: RefObject<HTMLInputElement | null>;
  type: 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
};

function DateRangeField({ icon, inputRef, type, value, onChange }: DateRangeFieldProps) {
  const Icon = icon === 'date' ? CalendarDays : Clock3;
  const label = icon === 'date' ? 'Открыть календарь' : 'Открыть выбор времени';

  return (
    <div className="archive-date-field" onClick={() => openInputPicker(inputRef.current)}>
      <button type="button" className="archive-date-picker-button" aria-label={label}>
        <Icon size={16} />
      </button>
      <input
        ref={inputRef}
        aria-label={label}
        className={`archive-date-input archive-date-input--${type}`}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function ArchiveView({
  edgeId,
  getTagLabel,
  historyAxis,
  historyGranulate,
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
  const fromDateRef = useRef<HTMLInputElement>(null);
  const fromTimeRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);
  const toTimeRef = useRef<HTMLInputElement>(null);
  const fromIso = toIsoFromInput(range.from) as string;
  const toIso = toIsoFromInput(range.to) as string;
  const updateRangePart = (rangePart: RangePart, inputPart: RangeInputPart, value: string) => {
    onRangeChange({
      ...range,
      [rangePart]: updateRangeInputPart(range[rangePart], inputPart, value),
    });
  };
  const updateRangeFromZoom = (nextRange: HistoryZoomRange) => {
    onRangeChange({
      from: toInputDateTimeValue(new Date(nextRange.from)),
      to: toInputDateTimeValue(new Date(nextRange.to)),
    });
  };

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
                    aria-pressed={selected}
                  >
                    <span className="tag-select-item__name">
                      <span>{label}</span>
                      {label !== item.tag ? <small>{item.tag}</small> : null}
                    </span>
                    <span className="tag-select-item__side">
                      <strong>{item.value.toLocaleString('ru-RU', { maximumFractionDigits: item.precision ?? 3 })}</strong>
                      {selected ? <Check size={15} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="archive-chart"
        onFocusCapture={() => setSelectorOpen(false)}
        onPointerDown={() => setSelectorOpen(false)}
        onPointerEnter={() => setSelectorOpen(false)}
      >
        <div className="toolbar">
          <div className="segmented">
            {RANGE_PRESETS.map((preset) => (
              <button key={preset.id} type="button" onClick={() => onRangeChange(createRange(preset.hours))}>
                {preset.label}
              </button>
            ))}
          </div>
          <div className="archive-date-range">
            <span>С</span>
            <DateRangeField
              icon="date"
              inputRef={fromDateRef}
              type="date"
              value={getRangeInputPart(range.from, 'date')}
              onChange={(value) => updateRangePart('from', 'date', value)}
            />
            <DateRangeField
              icon="time"
              inputRef={fromTimeRef}
              type="time"
              value={getRangeInputPart(range.from, 'time')}
              onChange={(value) => updateRangePart('from', 'time', value)}
            />
          </div>
          <div className="archive-date-range">
            <span>По</span>
            <DateRangeField
              icon="date"
              inputRef={toDateRef}
              type="date"
              value={getRangeInputPart(range.to, 'date')}
              onChange={(value) => updateRangePart('to', 'date', value)}
            />
            <DateRangeField
              icon="time"
              inputRef={toTimeRef}
              type="time"
              value={getRangeInputPart(range.to, 'time')}
              onChange={(value) => updateRangePart('to', 'time', value)}
            />
          </div>
        </div>

        {selectedTags.length ? (
          <HistoryChart
            key={`${range.from}:${range.to}:${historyAxis.granulate}`}
            edge={edgeId}
            from={fromIso}
            to={toIso}
            granulate={historyAxis.granulate}
            tickIntervalMs={historyAxis.tickIntervalMs}
            labelFormat={historyAxis.labelFormat}
            tags={selectedTags}
            tagLabels={tagLabels}
            onZoomRangeChange={updateRangeFromZoom}
          />
        ) : (
          <div className="chart-placeholder">Разверните список показателей и выберите серию для графика</div>
        )}
      </div>
    </section>
  );
}
