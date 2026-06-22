import type { SeriesOption } from 'echarts';
import type { HistoryPoint } from '../../entities/history/types';
import type { AvgPointValue } from './chartTypes';

export const SERIES_COLORS = [
  '#5B8FF9',
  '#5AD8A6',
  '#F6BD16',
  '#E8684A',
  '#6DC8EC',
  '#FF9D4D',
  '#73D13D',
  '#A7B3FF',
];

/** Создает avg-линию, вертикальные min/max-отрезки и точки экстремумов для одной серии. */
export function createSeriesOptions(points: HistoryPoint[], index: number, label: string): SeriesOption[] {
  const color = SERIES_COLORS[index % SERIES_COLORS.length];
  const avgData: AvgPointValue[] = points.map((point) => {
    const time = new Date(point.time).getTime();
    return [time, point.avg_value, point.min_value, point.max_value, point.point_count];
  });
  const spreadData = points.flatMap((point) => {
    const time = new Date(point.time).getTime();
    return [
      [time, point.min_value],
      [time, point.max_value],
      [time, null],
    ];
  });

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
      data: points.map((point) => [new Date(point.time).getTime(), point.min_value]),
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
      data: points.map((point) => [new Date(point.time).getTime(), point.max_value]),
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
