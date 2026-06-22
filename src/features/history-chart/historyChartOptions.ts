import type { EChartsOption } from 'echarts';
import type { HistoryResponse } from '../../entities/history/types';
import type { HistoryAxisLabelFormat } from '../../utils/historyGranularity';
import type { DataZoomState } from './chartTypes';
import { formatAxisDate, formatTooltip } from './historyChartFormat';
import { createSeriesOptions, SERIES_COLORS } from './historyChartSeries';

export type HistoryChartOptionsInput = {
  data?: HistoryResponse;
  dataZoomState: DataZoomState;
  from?: string;
  to?: string;
  labelFormat?: HistoryAxisLabelFormat;
  legendData: string[];
  seriesLabel: string;
  tickIntervalMs?: number;
};

export function createHistoryChartOptions({
  data,
  dataZoomState,
  from,
  to,
  labelFormat,
  legendData,
  seriesLabel,
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
      backgroundColor: 'rgba(10, 13, 18, 0.96)',
      borderColor: 'rgba(212, 165, 116, 0.32)',
      textStyle: { color: '#f8fafc' },
      formatter: formatTooltip,
    },
    legend: {
      type: 'scroll',
      top: 0,
      data: legendData,
      textStyle: { color: '#cbd5e1' },
    },
    grid: {
      top: 54,
      left: 48,
      right: 24,
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
        type: 'inside',
        throttle: 80,
        start: dataZoomState.start,
        end: dataZoomState.end,
        startValue: dataZoomState.startValue,
        endValue: dataZoomState.endValue,
      },
      {
        type: 'slider',
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
    ],
    series: data?.rows.length ? createSeriesOptions(data.rows, 0, seriesLabel) : [],
  };
}
