import type { AvgLineMode } from './chartTypes';

type HistoryChartAvgLineModeControlProps = {
  value: AvgLineMode;
  onChange: (mode: AvgLineMode) => void;
};

const AVG_LINE_MODES: Array<{ value: AvgLineMode; label: string }> = [
  { value: 'auto', label: 'Авто' },
  { value: 'show', label: 'Рисовать' },
  { value: 'hide', label: 'Скрывать' },
];

export function HistoryChartAvgLineModeControl({ value, onChange }: HistoryChartAvgLineModeControlProps) {
  return (
    <div className="archive-toolbar-segmented-control archive-avgline-mode-control" aria-label="Режим соединительной линии avg">
      <span>Соединительная линия</span>
      <div className="segmented history-chart-line-mode">
        {AVG_LINE_MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            className={mode.value === value ? 'segmented__button--active' : undefined}
            onClick={() => onChange(mode.value)}
            aria-pressed={mode.value === value}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
