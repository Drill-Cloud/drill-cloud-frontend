import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { CalendarDays, Clock3, Plus, X } from 'lucide-react';
import type { CurrentItem } from '../../entities/current/types';
import { RANGE_PRESETS, createRange, type DateRangeState } from '../history/dateRange';
import { toIsoFromInput } from '../../utils/format';
import type { HistoryGranularity } from '../../utils/historyGranularity';
import { HistoryChart } from './HistoryChart';
import { HistoryChartAvgLineModeControl } from './HistoryChartAvgLineModeControl';
import { HistoryTagPicker } from './HistoryTagPicker';
import type { AvgLineMode, HistoryZoomRange } from './chartTypes';
import { createInitialZoomRange } from './historyChartZoom';

type HistoryChartConfig = {
  id: string;
  selectedTags: string[];
  selectorOpen: boolean;
};

type HistoryChartSetProps = {
  avgLineMode: AvgLineMode;
  edgeId: string;
  getTagLabel: (tag: string) => string;
  historyAxis: HistoryGranularity;
  initialSelectedTags?: string[];
  items: CurrentItem[];
  range: DateRangeState;
  tagLabels: Record<string, string>;
  onAvgLineModeChange: (value: AvgLineMode) => void;
  onRangeChange: (value: DateRangeState) => void;
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

function createChartId(): string {
  return `chart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createZoomRange(range: DateRangeState, historyAxis: HistoryGranularity): HistoryZoomRange {
  return createInitialZoomRange({
    from: toIsoFromInput(range.from) as string,
    granulate: historyAxis.granulate,
    labelFormat: historyAxis.labelFormat,
    tickIntervalMs: historyAxis.tickIntervalMs,
    to: toIsoFromInput(range.to) as string,
  });
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

type HistoryChartPanelProps = {
  canRemove: boolean;
  chart: HistoryChartConfig;
  cursorMs: number | null;
  edgeId: string;
  fromIso: string;
  getTagLabel: (tag: string) => string;
  historyAxis: HistoryGranularity;
  items: CurrentItem[];
  avgLineMode: AvgLineMode;
  tagLabels: Record<string, string>;
  toIso: string;
  zoomRange: HistoryZoomRange;
  onCloseSelector: (chartId: string) => void;
  onCursorChange: (value: number | null) => void;
  onRemove: (chartId: string) => void;
  onSelectedTagsChange: (chartId: string, tags: string[]) => void;
  onToggleSelector: (chartId: string) => void;
  onZoomRangeChange: (range: HistoryZoomRange) => void;
};

function HistoryChartPanel({
  canRemove,
  chart,
  cursorMs,
  edgeId,
  fromIso,
  getTagLabel,
  historyAxis,
  items,
  avgLineMode,
  tagLabels,
  toIso,
  zoomRange,
  onCloseSelector,
  onCursorChange,
  onRemove,
  onSelectedTagsChange,
  onToggleSelector,
  onZoomRangeChange,
}: HistoryChartPanelProps) {
  return (
    <article className="history-chart-panel">
      <div className="archive-tag-panel">
        <div
          className={`history-chart-panel__tag-toolbar${canRemove ? ' history-chart-panel__tag-toolbar--removable' : ''}`}
        >
          <HistoryTagPicker
            getTagLabel={getTagLabel}
            items={items}
            open={chart.selectorOpen}
            value={chart.selectedTags}
            onChange={(tags) => onSelectedTagsChange(chart.id, tags)}
            onOpenChange={(open) => {
              if (open !== chart.selectorOpen) {
                onToggleSelector(chart.id);
              }
            }}
          />
          {canRemove ? (
            <button
              type="button"
              className="history-chart-panel__remove"
              aria-label="Удалить график"
              title="Удалить график"
              onClick={() => onRemove(chart.id)}
            >
              <X size={17} />
            </button>
          ) : null}
        </div>
      </div>

      <div
        className="history-chart-panel__plot"
        onFocusCapture={() => onCloseSelector(chart.id)}
        onPointerDown={() => onCloseSelector(chart.id)}
        onPointerEnter={() => onCloseSelector(chart.id)}
      >
        <HistoryChart
          avgLineMode={avgLineMode}
          cursorMs={cursorMs}
          edge={edgeId}
          from={fromIso}
          to={toIso}
          granulate={historyAxis.granulate}
          tickIntervalMs={historyAxis.tickIntervalMs}
          labelFormat={historyAxis.labelFormat}
          tags={chart.selectedTags}
          tagLabels={tagLabels}
          zoomRange={zoomRange}
          onCursorChange={onCursorChange}
          onZoomRangeChange={onZoomRangeChange}
        />
      </div>
    </article>
  );
}

export function HistoryChartSet({
  avgLineMode,
  edgeId,
  getTagLabel,
  historyAxis,
  initialSelectedTags,
  items,
  range,
  tagLabels,
  onAvgLineModeChange,
  onRangeChange,
}: HistoryChartSetProps) {
  const [charts, setCharts] = useState<HistoryChartConfig[]>(() => [
    {
      id: createChartId(),
      selectedTags: initialSelectedTags ?? [],
      selectorOpen: false,
    },
  ]);
  const [cursorMs, setCursorMs] = useState<number | null>(null);
  const [zoomRange, setZoomRange] = useState(() => createZoomRange(range, historyAxis));
  const [selectedRangePresetId, setSelectedRangePresetId] = useState<string>('24h');
  const fromDateRef = useRef<HTMLInputElement>(null);
  const fromTimeRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);
  const toTimeRef = useRef<HTMLInputElement>(null);
  const fromIso = useMemo(() => toIsoFromInput(range.from) as string, [range.from]);
  const toIso = useMemo(() => toIsoFromInput(range.to) as string, [range.to]);

  useEffect(() => {
    setZoomRange(createZoomRange(range, historyAxis));
    setCursorMs(null);
  }, [historyAxis, range]);

  const updateChart = useCallback((chartId: string, updater: (chart: HistoryChartConfig) => HistoryChartConfig) => {
    setCharts((prev) => prev.map((chart) => (chart.id === chartId ? updater(chart) : chart)));
  }, []);

  const updateRangePart = (rangePart: RangePart, inputPart: RangeInputPart, value: string) => {
    setSelectedRangePresetId('');
    onRangeChange({
      ...range,
      [rangePart]: updateRangeInputPart(range[rangePart], inputPart, value),
    });
  };

  const toggleSelector = useCallback((chartId: string) => {
    setCharts((prev) =>
      prev.map((chart) => ({
        ...chart,
        selectorOpen: chart.id === chartId ? !chart.selectorOpen : false,
      })),
    );
  }, []);

  const closeSelector = useCallback(
    (chartId: string) => {
      updateChart(chartId, (chart) => ({ ...chart, selectorOpen: false }));
    },
    [updateChart],
  );

  const updateSelectedTags = useCallback(
    (chartId: string, selectedTags: string[]) => {
      updateChart(chartId, (chart) => ({ ...chart, selectedTags }));
    },
    [updateChart],
  );

  const addChart = useCallback(() => {
    setCharts((prev) => [
      ...prev,
      {
        id: createChartId(),
        selectedTags: [],
        selectorOpen: false,
      },
    ]);
  }, []);

  const removeChart = useCallback((chartId: string) => {
    setCharts((prev) => (prev.length > 1 ? prev.filter((chart) => chart.id !== chartId) : prev));
  }, []);

  return (
    <div className="history-chart-set">
      <div className="toolbar history-chart-set__toolbar">
        <div className="archive-toolbar-segmented-control">
          <div className="segmented segmented--range-preset">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={preset.id === selectedRangePresetId ? 'segmented__button--active' : undefined}
                onClick={() => {
                  setSelectedRangePresetId(preset.id);
                  onRangeChange(createRange(preset.hours));
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
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
        <HistoryChartAvgLineModeControl value={avgLineMode} onChange={onAvgLineModeChange} />
      </div>

      <div className="history-chart-set__items">
        {charts.map((chart) => (
          <HistoryChartPanel
            key={chart.id}
            canRemove={charts.length > 1}
            chart={chart}
            cursorMs={cursorMs}
            edgeId={edgeId}
            fromIso={fromIso}
            getTagLabel={getTagLabel}
            historyAxis={historyAxis}
            items={items}
            avgLineMode={avgLineMode}
            tagLabels={tagLabels}
            toIso={toIso}
            zoomRange={zoomRange}
            onCloseSelector={closeSelector}
            onCursorChange={setCursorMs}
            onRemove={removeChart}
            onSelectedTagsChange={updateSelectedTags}
            onToggleSelector={toggleSelector}
            onZoomRangeChange={setZoomRange}
          />
        ))}
      </div>

      <button type="button" className="history-chart-set__add" onClick={addChart} aria-label="Добавить график">
        <Plus size={18} />
        Добавить график
      </button>
    </div>
  );
}
