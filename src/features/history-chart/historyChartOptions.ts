import type { EChartsOption } from 'echarts';
import type { SeriesOption } from 'echarts';
import type { HistoryAxisLabelFormat } from '../../utils/historyGranularity';
import type { DataZoomState } from './chartTypes';
import { formatAxisDate, formatTooltip } from './historyChartFormat';
import { SERIES_COLORS } from './historyChartSeries';

export type HistoryChartOptionsInput = {
  dataZoomState: DataZoomState;
  from?: string;
  to?: string;
  labelFormat?: HistoryAxisLabelFormat;
  legendData: string[];
  series: SeriesOption[];
  tickIntervalMs?: number;
};

export function createHistoryChartOptions({
  dataZoomState,
  from,
  to,
  labelFormat,
  legendData,
  series,
  tickIntervalMs,
}: HistoryChartOptionsInput): EChartsOption {
  const xMin = from ? new Date(from).getTime() : undefined;
  const xMax = to ? new Date(to).getTime() : undefined;

  return {
    color: SERIES_COLORS,
    animation: false,
    backgroundColor: 'transparent',
    textStyle: {
      color: '#cbd5e1',
      fontFamily: 'Inter, Segoe UI, sans-serif',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        // Видимую вертикаль рисуем своим overlay во всех графиках набора.
        // Нативную линию ECharts прячем, чтобы на активном графике не было дубля.
        lineStyle: {
          color: 'rgba(226, 232, 240, 0)',
          type: 'dashed',
          width: 0,
        },
      },
      backgroundColor: 'rgba(10, 13, 18, 0.96)',
      borderColor: 'rgba(212, 165, 116, 0.32)',
      textStyle: { color: '#f8fafc' },
      formatter: formatTooltip,
    },
    legend: {
      type: 'scroll',
      top: 0,
      icon: 'rect',
      itemWidth: 18,
      itemHeight: 3,
      data: legendData,
      textStyle: { color: '#cbd5e1' },
    },
    grid: {
      top: 54,
      left: 48,
      right: 56,
      bottom: 72,
    },
    xAxis: {
      type: 'time',
      min: Number.isFinite(xMin) ? xMin : undefined,
      max: Number.isFinite(xMax) ? xMax : undefined,
      minInterval: tickIntervalMs,
      maxInterval: tickIntervalMs,
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.35)' } },
      axisLabel: {
        color: '#94a3b8',
        formatter: (value: number) => formatAxisDate(value, labelFormat),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.35)' } },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } },
    },
    dataZoom: [
      {
        id: 'history-x-inside',
        type: 'inside',
        xAxisIndex: 0,
        zoomOnMouseWheel: true,
        moveOnMouseWheel: false,
        throttle: 80,
        start: dataZoomState.start,
        end: dataZoomState.end,
        startValue: dataZoomState.startValue,
        endValue: dataZoomState.endValue,
      },
      {
        id: 'history-x-slider',
        type: 'slider',
        xAxisIndex: 0,
        bottom: 18,
        height: 28,
        borderColor: 'rgba(148, 163, 184, 0.24)',
        fillerColor: 'rgba(91, 143, 249, 0.18)',
        handleStyle: {
          color: '#d4a574',
          borderColor: '#e8c9a0',
        },
        textStyle: { color: '#94a3b8' },
        start: dataZoomState.start,
        end: dataZoomState.end,
        startValue: dataZoomState.startValue,
        endValue: dataZoomState.endValue,
      },
      {
        id: 'history-y-inside',
        type: 'inside',
        yAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: 'shift',
        moveOnMouseWheel: false,
        throttle: 80,
      },
      {
        id: 'history-y-slider',
        type: 'slider',
        yAxisIndex: 0,
        filterMode: 'none',
        right: 8,
        width: 12,
        borderColor: 'rgba(148, 163, 184, 0.24)',
        fillerColor: 'rgba(91, 143, 249, 0.18)',
        handleStyle: {
          color: '#d4a574',
          borderColor: '#e8c9a0',
        },
        textStyle: { color: '#94a3b8' },
      },
    ],
    series,
  };
}
