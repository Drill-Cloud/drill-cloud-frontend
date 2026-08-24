import type { EChartsOption } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/esm/core.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DataZoomEventBatch, DataZoomState } from './chartTypes';
import { echarts } from './historyChartEcharts';

type HistoryChartAreaProps = {
  cursorMs?: number | null;
  dataZoomState: DataZoomState;
  hasData: boolean;
  hasSelection: boolean;
  loading: boolean;
  option: EChartsOption;
  onCursorChange?: (value: number | null) => void;
  onDataZoom: (event: DataZoomEventBatch) => void;
  zoomFromMs: number;
  zoomToMs: number;
};

type AxisPointerEvent = {
  axesInfo?: Array<{
    value?: unknown;
  }>;
};

/** Достает время X-курсора из события ECharts axisPointer. */
function readAxisPointerValue(event: unknown): number | null {
  const axesInfo = (event as AxisPointerEvent).axesInfo;
  const xValue = axesInfo?.find((item) => item.value !== undefined)?.value;
  const value = Number(xValue);

  return Number.isFinite(value) ? value : null;
}

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
  cursorMs,
  dataZoomState,
  hasData,
  hasSelection,
  loading,
  option,
  onCursorChange,
  onDataZoom,
  zoomFromMs,
  zoomToMs,
}: HistoryChartAreaProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<InstanceType<typeof ReactEChartsCore> | null>(null);
  const xWheelZoomEnabledRef = useRef(true);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const handleAxisPointerUpdate = useCallback(
    (event: unknown) => {
      const value = readAxisPointerValue(event);

      if (value !== null) {
        onCursorChange?.(value);
      }
    },
    [onCursorChange],
  );
  const onChartEvents = useMemo(
    () => ({
      datazoom: onDataZoom,
      updateAxisPointer: handleAxisPointerUpdate,
    }),
    [handleAxisPointerUpdate, onDataZoom],
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

  useEffect(() => {
    const shell = shellRef.current;

    if (!shell) {
      return undefined;
    }

    const handleWheel = (event: WheelEvent) => {
      updateXAxisWheelZoom(!event.shiftKey);
    };

    // ECharts тоже слушает wheel на своем canvas. Нативный capture-listener на родителе
    // срабатывает раньше и успевает переключить режим: обычное колесо -> X, Shift+колесо -> только Y.
    shell.addEventListener('wheel', handleWheel, { capture: true, passive: true });

    return () => {
      shell.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [updateXAxisWheelZoom]);

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();

    if (!chart) {
      return;
    }

    // Общий X-zoom приходит от родителя набора графиков. Принудительно применяем его к каждому canvas,
    // чтобы нижний slider и видимая область синхронно обновлялись у всех графиков набора.
    chart.setOption(
      {
        dataZoom: [
          {
            id: 'history-x-inside',
            start: dataZoomState.start,
            end: dataZoomState.end,
            startValue: dataZoomState.startValue,
            endValue: dataZoomState.endValue,
          },
          {
            id: 'history-x-slider',
            start: dataZoomState.start,
            end: dataZoomState.end,
            startValue: dataZoomState.startValue,
            endValue: dataZoomState.endValue,
          },
        ],
      },
      { lazyUpdate: true, silent: true },
    );
  }, [dataZoomState.end, dataZoomState.endValue, dataZoomState.start, dataZoomState.startValue]);

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();

    if (!chart || !onCursorChange) {
      return undefined;
    }

    const getVisibleXBounds = () => {
      const left = Number(chart.convertToPixel({ xAxisIndex: 0 }, zoomFromMs));
      const right = Number(chart.convertToPixel({ xAxisIndex: 0 }, zoomToMs));

      if (!Number.isFinite(left) || !Number.isFinite(right)) {
        return null;
      }

      return {
        left: Math.min(left, right),
        right: Math.max(left, right),
      };
    };

    const renderer = chart.getZr();
    const handleMouseMove = (event: { offsetX: number; offsetY: number }) => {
      const bounds = getVisibleXBounds();

      if (!bounds || event.offsetX < bounds.left || event.offsetX > bounds.right) {
        return;
      }

      const point: [number, number] = [event.offsetX, event.offsetY];
      const value = chart.convertFromPixel({ xAxisIndex: 0 }, point);
      const xValue = Array.isArray(value) ? Number(value[0]) : Number(value);

      if (Number.isFinite(xValue)) {
        onCursorChange(xValue);
      }
    };
    renderer.on('mousemove', handleMouseMove);

    return () => {
      renderer.off('mousemove', handleMouseMove);
    };
  }, [onCursorChange, option, zoomFromMs, zoomToMs]);

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();

    if (cursorMs === null || cursorMs === undefined || !chart) {
      setCursorX(null);
      return;
    }

    if (cursorMs < zoomFromMs || cursorMs > zoomToMs) {
      setCursorX(null);
      return;
    }

    const frameId = requestAnimationFrame(() => {
      const nextCursorX = Number(chart.convertToPixel({ xAxisIndex: 0 }, cursorMs));
      setCursorX(Number.isFinite(nextCursorX) ? nextCursorX : null);
    });

    return () => cancelAnimationFrame(frameId);
  }, [cursorMs, option, zoomFromMs, zoomToMs]);

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
    <div ref={shellRef} className="history-chart-shell" data-testid="history-chart">
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={option}
        className="history-chart"
        onEvents={onChartEvents}
        replaceMerge={['series']}
        lazyUpdate
      />
      {cursorX !== null ? (
        <div className="history-chart-shared-cursor" style={{ left: cursorX }} />
      ) : null}
    </div>
  );
}
