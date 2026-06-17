import { LineChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/esm/core.js';
import type { HistoryResponse } from '../api/cloud';

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

const SERIES_COLORS = [
  '#5B8FF9',
  '#5AD8A6',
  '#F6BD16',
  '#E8684A',
  '#6DC8EC',
  '#FF9D4D',
  '#73D13D',
  '#A7B3FF',
];

type HistoryChartProps = {
  data?: HistoryResponse;
  loading: boolean;
  from?: string;
  to?: string;
  tagLabels?: Record<string, string>;
};

/** Подбирает подпись оси времени под текущий масштаб графика. */
function formatAxisDate(value: number, spanMs?: number): string {
  const date = new Date(value);

  if (!spanMs || spanMs <= 24 * 60 * 60 * 1000) {
    return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date);
  }

  if (spanMs <= 7 * 24 * 60 * 60 * 1000) {
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit' }).format(date);
  }

  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(date);
}

/** Рисует исторические ряды показателей через ECharts с динамической временной шкалой. */
export function HistoryChart({ data, loading, from, to, tagLabels = {} }: HistoryChartProps) {
  const xMin = from ? new Date(from).getTime() : undefined;
  const xMax = to ? new Date(to).getTime() : undefined;
  const xSpan = Number.isFinite(xMin) && Number.isFinite(xMax) ? Number(xMax) - Number(xMin) : undefined;

  const option = {
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
      valueFormatter: (value: unknown) => (typeof value === 'number' ? value.toFixed(3) : String(value)),
    },
    legend: {
      type: 'scroll',
      top: 0,
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
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.35)' } },
      axisLabel: {
        color: '#94a3b8',
        formatter: (value: number) => formatAxisDate(value, xSpan),
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
      },
    ],
    series:
      data?.series.map((series, index) => ({
        name: tagLabels[series.tag] ?? series.tag,
        type: 'line',
        showSymbol: false,
        smooth: false,
        sampling: 'lttb',
        lineStyle: {
          width: 1.8,
          color: SERIES_COLORS[index % SERIES_COLORS.length],
        },
        emphasis: {
          focus: 'series',
        },
        data: series.points.map((point) => [point.t, point.v]),
      })) ?? [],
  };

  if (loading) {
    return <div className="chart-placeholder">Загрузка графика...</div>;
  }

  if (!data?.series.length) {
    return <div className="chart-placeholder">Нет данных для выбранного диапазона</div>;
  }

  return <ReactEChartsCore echarts={echarts} option={option} className="history-chart" notMerge lazyUpdate />;
}
