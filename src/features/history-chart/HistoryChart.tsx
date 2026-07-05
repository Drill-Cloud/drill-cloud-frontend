import { useCallback, useMemo, useRef } from 'react';
import type { HistoryAxisLabelFormat } from '../../utils/historyGranularity';
import type { DataZoomEventBatch, DataZoomState } from './chartTypes';
import { HistoryChartArea } from './HistoryChartArea';
import { createHistoryChartOptions } from './historyChartOptions';
import { useHistoryChartQueries } from './useHistoryChartQueries';
import { useHistoryChartSeries } from './useHistoryChartSeries';

type HistoryChartProps = {
  edge: string;
  from: string;
  granulate: string;
  labelFormat?: HistoryAxisLabelFormat;
  tags: string[];
  tickIntervalMs?: number;
  to: string;
  tagLabels?: Record<string, string>;
};

/** Контейнер истории: загружает выбранные теги и передает готовые серии в область ECharts. */
function isXAxisDataZoom(state: DataZoomState): boolean {
  return state.dataZoomId?.startsWith('history-x-') || state.dataZoomIndex === 0 || state.dataZoomIndex === 1;
}

export function HistoryChart({
  edge,
  from,
  granulate,
  labelFormat,
  tags,
  tickIntervalMs,
  to,
  tagLabels = {},
}: HistoryChartProps) {
  const dataZoomRef = useRef<DataZoomState | null>(null);
  const lines = useHistoryChartQueries({ edge, from, granulate, tags, to, tagLabels });
  const series = useHistoryChartSeries(lines, granulate);
  const legendData = useMemo(() => lines.map((line) => line.label), [lines]);
  const loading = lines.some((line) => line.loading);

  const option = useMemo(
    () =>
      createHistoryChartOptions({
        dataZoomState: dataZoomRef.current ?? {},
        from,
        to,
        labelFormat,
        legendData,
        series,
        tickIntervalMs,
      }),
    [from, labelFormat, legendData, series, tickIntervalMs, to],
  );

  const handleDataZoom = useCallback((event: DataZoomEventBatch) => {
    const state = (event.batch ?? [event]).find(isXAxisDataZoom);

    if (!state) {
      return;
    }

    dataZoomRef.current = {
      start: state.start,
      end: state.end,
      startValue: state.startValue,
      endValue: state.endValue,
    };
  }, []);

  return (
    <HistoryChartArea
      hasData={series.length > 0}
      hasSelection={tags.length > 0}
      loading={loading}
      option={option}
      onDataZoom={handleDataZoom}
    />
  );
}
