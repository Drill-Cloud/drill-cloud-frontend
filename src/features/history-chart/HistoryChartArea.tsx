import type { EChartsOption } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/esm/core.js';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { WheelEvent } from 'react';
import type { AvgLineMode, DataZoomEventBatch } from './chartTypes';
import { echarts } from './historyChartEcharts';

type HistoryChartAreaProps = {
  avgLineMode: AvgLineMode;
  hasData: boolean;
  hasSelection: boolean;
  loading: boolean;
  option: EChartsOption;
  onAvgLineModeChange: (mode: AvgLineMode) => void;
  onDataZoom: (event: DataZoomEventBatch) => void;
};

// Порядок режимов соответствует требованию: авто, принудительно рисовать, принудительно скрыть.
const AVG_LINE_MODES: Array<{ value: AvgLineMode; label: string }> = [
  { value: 'auto', label: 'Авто' },
  { value: 'show', label: 'Рисовать' },
  { value: 'hide', label: 'Не рисовать' },
];

/** Включает или выключает нативный X-зум колесом, чтобы Shift + колесо работал только по Y. */
function setXAxisWheelZoom(chart: ReturnType<ReactEChartsCore['getEchartsInstance']>, enabled: boolean): void {
  chart.setOption(
    {
      dataZoom: [
        {
          id: 'history-x-inside',
          zoomOnMouseWheel: enabled,
        },
      ],
    },
    { lazyUpdate: true },
  );
}

/** Отвечает только за визуальную область графика: placeholder или ECharts canvas. */
export function HistoryChartArea({
  avgLineMode,
  hasData,
  hasSelection,
  loading,
  option,
  onAvgLineModeChange,
  onDataZoom,
}: HistoryChartAreaProps) {
  const chartRef = useRef<InstanceType<typeof ReactEChartsCore> | null>(null);
  const xWheelZoomEnabledRef = useRef(true);
  const onChartEvents = useMemo(
    () => ({
      datazoom: onDataZoom,
    }),
    [onDataZoom],
  );
  const updateXAxisWheelZoom = useCallback((enabled: boolean) => {
    const chart = chartRef.current?.getEchartsInstance();

    if (!chart || xWheelZoomEnabledRef.current === enabled) {
      return;
    }

    xWheelZoomEnabledRef.current = enabled;
    setXAxisWheelZoom(chart, enabled);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        updateXAxisWheelZoom(false);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        updateXAxisWheelZoom(true);
      }
    };
    const handleBlur = () => updateXAxisWheelZoom(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [updateXAxisWheelZoom]);

  const handleWheelCapture = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      updateXAxisWheelZoom(!event.shiftKey);
    },
    [updateXAxisWheelZoom],
  );

  if (!hasSelection) {
    return <div className="chart-placeholder">Разверните список показателей и выберите серию для графика</div>;
  }

  if (!hasData && loading) {
    return <div className="chart-placeholder">Загрузка графика...</div>;
  }

  if (!hasData) {
    return <div className="chart-placeholder">Нет данных для выбранного диапазона</div>;
  }

  return (
    <div className="history-chart-shell" onWheelCapture={handleWheelCapture}>
      <div className="history-chart-controls" aria-label="Режим соединительной линии avg">
        <span>Линия avg</span>
        <div className="segmented history-chart-line-mode">
          {AVG_LINE_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              className={mode.value === avgLineMode ? 'history-chart-line-mode__button--active' : undefined}
              onClick={() => onAvgLineModeChange(mode.value)}
              aria-pressed={mode.value === avgLineMode}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
      <ReactEChartsCore
        key={avgLineMode}
        ref={chartRef}
        echarts={echarts}
        option={option}
        className="history-chart"
        onEvents={onChartEvents}
        lazyUpdate
      />
    </div>
  );
}
