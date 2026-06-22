import { LineChart, ScatterChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/esm/core.js';
import { useMemo, useRef } from 'react';
import type { HistoryResponse } from '../../entities/history/types';
import type { HistoryAxisLabelFormat } from '../../utils/historyGranularity';
import type { DataZoomEventBatch, DataZoomState } from './chartTypes';
import { createHistoryChartOptions } from './historyChartOptions';

echarts.use([
  LineChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

type HistoryChartProps = {
  data?: HistoryResponse;
  loading: boolean;
  from?: string;
  to?: string;
  tickIntervalMs?: number;
  labelFormat?: HistoryAxisLabelFormat;
  tag?: string;
  tagLabels?: Record<string, string>;
};

/** Рисует avg-линию, min/max-точки и вертикальный диапазон для агрегированной истории. */
export function HistoryChart({
  data,
  loading,
  from,
  to,
  tickIntervalMs,
  labelFormat,
  tag,
  tagLabels = {},
}: HistoryChartProps) {
  const dataZoomRef = useRef<DataZoomState | null>(null);
  const seriesLabel = tag ? tagLabels[tag] ?? tag : '';
  const legendData = useMemo(() => (data?.rows.length && seriesLabel ? [seriesLabel] : []), [data?.rows.length, seriesLabel]);

  const option = useMemo(
    () =>
      createHistoryChartOptions({
        data,
        dataZoomState: dataZoomRef.current ?? {},
        from,
        to,
        labelFormat,
        legendData,
        seriesLabel,
        tickIntervalMs,
      }),
    [data, from, labelFormat, legendData, seriesLabel, tickIntervalMs, to],
  );

  const onChartEvents = useMemo(
    () => ({
      datazoom: (event: DataZoomEventBatch) => {
        const state = event.batch?.[0] ?? event;
        dataZoomRef.current = {
          start: state.start,
          end: state.end,
          startValue: state.startValue,
          endValue: state.endValue,
        };
      },
    }),
    [],
  );

  if (loading) {
    return <div className="chart-placeholder">Загрузка графика...</div>;
  }

  if (!data?.rows.length) {
    return <div className="chart-placeholder">Нет данных для выбранного диапазона</div>;
  }

  return <ReactEChartsCore echarts={echarts} option={option} className="history-chart" onEvents={onChartEvents} lazyUpdate />;
}
