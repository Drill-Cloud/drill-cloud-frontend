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
import type { EChartsOption, SeriesOption } from 'echarts';
import { useMemo, useRef } from 'react';
import type { HistoryResponse } from '../api/cloud';

echarts.use([
  LineChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

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

type AvgPointValue = [time: number, value: number, min: number, avg: number, max: number, count: number];

type TooltipParam = {
  marker?: string;
  seriesName?: string;
  value?: unknown;
};

type DataZoomState = {
  start?: number;
  end?: number;
  startValue?: number;
  endValue?: number;
};

type DataZoomEventBatch = DataZoomState & {
  batch?: DataZoomState[];
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

/** Форматирует числовое значение для tooltip без лишнего шума в дробной части. */
function formatChartValue(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: Math.abs(value) >= 100 ? 2 : 3,
  }).format(value);
}

/** Проверяет, что tooltip получил основную точку avg-линии, а не вспомогательную серию. */
function isAvgPointValue(value: unknown): value is AvgPointValue {
  return Array.isArray(value) && value.length >= 6 && value.every((item) => typeof item === 'number');
}

/** Собирает tooltip с min/avg/max для всех серий на выбранной отметке времени. */
function formatTooltip(params: unknown): string {
  const items = (Array.isArray(params) ? params : [params]).filter(
    (item): item is TooltipParam => typeof item === 'object' && item !== null,
  );
  const avgItems = items.filter((item) => isAvgPointValue(item.value));
  const firstValue = avgItems[0]?.value as AvgPointValue | undefined;

  if (!firstValue) {
    return '';
  }

  const header = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(firstValue[0]));

  const rows = avgItems.map((item) => {
    const value = item.value as AvgPointValue;
    return [
      '<div class="chart-tooltip-row">',
      `<span>${item.marker ?? ''}${item.seriesName ?? ''}</span>`,
      '<strong>',
      `min ${formatChartValue(value[2])} · avg ${formatChartValue(value[3])} · max ${formatChartValue(value[4])}`,
      value[5] > 1 ? ` · ${value[5]} точек` : '',
      '</strong>',
      '</div>',
    ].join('');
  });

  return [`<div class="chart-tooltip"><div class="chart-tooltip-title">${header}</div>`, ...rows, '</div>'].join('');
}

/** Создает avg-линию, вертикальные min/max отрезки и точки экстремумов для одной серии. */
function createSeriesOptions(
  series: NonNullable<HistoryResponse['series']>[number],
  index: number,
  label: string,
): SeriesOption[] {
  const color = SERIES_COLORS[index % SERIES_COLORS.length];
  const avgData: AvgPointValue[] = series.points.map((point) => [
    point.t,
    point.v,
    point.min,
    point.avg,
    point.max,
    point.count,
  ]);
  const spreadData = series.points.flatMap((point) => [
    [point.t, point.min],
    [point.t, point.max],
    [point.t, null],
  ]);

  return [
    {
      name: `${label} min/max`,
      type: 'line',
      data: spreadData,
      showSymbol: false,
      connectNulls: false,
      silent: true,
      tooltip: { show: false },
      legendHoverLink: false,
      lineStyle: {
        width: 1,
        opacity: 0.42,
        color,
      },
      emphasis: {
        disabled: true,
      },
      z: 1,
    },
    {
      name: `${label} min`,
      type: 'scatter',
      data: series.points.map((point) => [point.t, point.min]),
      symbolSize: 4,
      silent: true,
      tooltip: { show: false },
      itemStyle: {
        color,
        opacity: 0.72,
      },
      emphasis: {
        disabled: true,
      },
      z: 2,
    },
    {
      name: `${label} max`,
      type: 'scatter',
      data: series.points.map((point) => [point.t, point.max]),
      symbolSize: 4,
      silent: true,
      tooltip: { show: false },
      itemStyle: {
        color,
        opacity: 0.72,
      },
      emphasis: {
        disabled: true,
      },
      z: 2,
    },
    {
      name: label,
      type: 'line',
      showSymbol: false,
      smooth: false,
      sampling: 'lttb',
      data: avgData,
      lineStyle: {
        width: 1.8,
        color,
      },
      emphasis: {
        focus: 'series',
      },
      z: 3,
    },
  ];
}

/** Рисует исторические ряды: avg соединяется линией, min/max показываются точками и вертикальным диапазоном. */
export function HistoryChart({ data, loading, from, to, tagLabels = {} }: HistoryChartProps) {
  const dataZoomRef = useRef<DataZoomState | null>(null);
  const xMin = from ? new Date(from).getTime() : undefined;
  const xMax = to ? new Date(to).getTime() : undefined;
  const xSpan = Number.isFinite(xMin) && Number.isFinite(xMax) ? Number(xMax) - Number(xMin) : undefined;
  const legendData = useMemo(
    () => data?.series.map((series) => tagLabels[series.tag] ?? series.tag) ?? [],
    [data?.series, tagLabels],
  );
  const dataZoomState = dataZoomRef.current ?? {};

  const option: EChartsOption = useMemo(() => ({
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
    series:
      data?.series.flatMap((series, index) =>
        createSeriesOptions(series, index, tagLabels[series.tag] ?? series.tag),
      ) ?? [],
  }), [data?.series, dataZoomState.end, dataZoomState.endValue, dataZoomState.start, dataZoomState.startValue, legendData, tagLabels, xMax, xMin, xSpan]);

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
