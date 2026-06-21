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
  tagLabels = {},
}: HistoryChartProps) {
  const dataZoomRef = useRef<DataZoomState | null>(null);
  const legendData = useMemo(
    () => data?.series.map((series) => tagLabels[series.tag] ?? series.tag) ?? [],
    [data?.series, tagLabels],
  );

  const option = useMemo(
    () =>
      createHistoryChartOptions({
        data,
        dataZoomState: dataZoomRef.current ?? {},
        from,
        to,
        labelFormat,
        legendData,
        tagLabels,
        tickIntervalMs,
      }),
    [data, from, labelFormat, legendData, tagLabels, tickIntervalMs, to],
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

  if (!data?.series.length) {
    return <div className="chart-placeholder">Нет данных для выбранного диапазона</div>;
  }

  return <ReactEChartsCore echarts={echarts} option={option} className="history-chart" onEvents={onChartEvents} lazyUpdate />;
}
