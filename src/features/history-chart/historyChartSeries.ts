import type {
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
  CustomSeriesRenderItemReturn,
  SeriesOption,
} from 'echarts';
import { graphic } from 'echarts/core';
import type { HistoryPoint } from '../../entities/history/types';
import { parseGranulateMs } from '../../utils/historyGranularity';
import type { HistoryBucketValue } from './chartTypes';

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

const BUCKET = {
  time: 0,
  avg: 1,
  min: 2,
  max: 3,
  count: 4,
  slotMs: 5,
} as const;

type CartesianCoordSys = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ChartArea = CartesianCoordSys;

type BucketValues = {
  time: number;
  avg: number;
  min: number;
  max: number;
  slotMs: number;
};

/** Ограничивает число заданными границами, чтобы фигуры не выходили за canvas графика. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Создает вертикальный градиент min..max с максимальной яркостью в позиции avg. */
function createAvgGradientStops(color: string, avgOffset: number) {
  const softZone = 0.18;

  return [
    { offset: 0, color: `${color}00` },
    { offset: clamp(avgOffset - softZone, 0, 1), color: `${color}22` },
    { offset: avgOffset, color: `${color}70` },
    { offset: clamp(avgOffset + softZone, 0, 1), color: `${color}22` },
    { offset: 1, color: `${color}00` },
  ].sort((first, second) => first.offset - second.offset);
}

/** Проверяет, что точку можно безопасно отрисовать на графике. */
function isFinitePoint(point: HistoryPoint): boolean {
  return [point.avg_value, point.min_value, point.max_value].every(Number.isFinite);
}

/** Упаковывает bucket в tuple для custom series ECharts. */
function createBucketData(points: HistoryPoint[], slotMs: number): HistoryBucketValue[] {
  const finitePoints = points.filter(isFinitePoint);

  return finitePoints.map((point) => [
      new Date(point.time).getTime(),
      point.avg_value,
      point.min_value,
      point.max_value,
      point.point_count,
      slotMs,
    ]);
}

/** Читает tuple bucket-а из ECharts API и возвращает значения с понятными именами. */
function readBucketValues(api: CustomSeriesRenderItemAPI): BucketValues {
  return {
    time: Number(api.value(BUCKET.time)),
    avg: Number(api.value(BUCKET.avg)),
    min: Number(api.value(BUCKET.min)),
    max: Number(api.value(BUCKET.max)),
    slotMs: Number(api.value(BUCKET.slotMs)),
  };
}

/** Считает пиксельные фигуры одного bucket-а и обрезает их по области графика. */
function createBucketShapes(api: CustomSeriesRenderItemAPI, values: BucketValues, chartArea: ChartArea) {
  const avgPoint = api.coord([values.time, values.avg]);
  const minPoint = api.coord([values.time, values.min]);
  const maxPoint = api.coord([values.time, values.max]);
  const slotStart = api.coord([values.time - values.slotMs / 2, values.avg]);
  const slotEnd = api.coord([values.time + values.slotMs / 2, values.avg]);

  const x = Math.min(slotStart[0], slotEnd[0]);
  const rawHeight = Math.abs(maxPoint[1] - minPoint[1]);
  const width = Math.max(2, Math.abs(slotEnd[0] - slotStart[0]));
  const height = Math.max(2, rawHeight);
  const y = Math.min(minPoint[1], maxPoint[1]) - (height - rawHeight) / 2;
  const avgY = avgPoint[1];

  const rangeShape = graphic.clipRectByRect({ x, y, width, height }, chartArea);
  const avgShape = graphic.clipRectByRect({ x, y: avgY - 1, width, height: 2 }, chartArea);

  if (!rangeShape) {
    return null;
  }

  return {
    avgPoint,
    avgShape,
    avgY,
    rangeShape,
  };
}

/** Рисует один bucket: min..max слот и горизонтальный avg-маркер. */
function renderBucket(color: string) {
  return (params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI): CustomSeriesRenderItemReturn => {
    const values = readBucketValues(api);

    // ECharts отдает размеры области графика в runtime, но в публичных типах они не описаны.
    const chartArea = params.coordSys as unknown as ChartArea;
    const bucketShapes = createBucketShapes(api, values, chartArea);

    if (!bucketShapes) {
      return null;
    }

    const avgOffset = clamp(
      (bucketShapes.avgY - bucketShapes.rangeShape.y) / bucketShapes.rangeShape.height,
      0,
      1,
    );

    return {
      type: 'group',
      silent: true,
      children: [
        {
          type: 'rect',
          silent: true,
          shape: bucketShapes.rangeShape,
          style: {
            fill: new graphic.LinearGradient(0, 0, 0, 1, createAvgGradientStops(color, avgOffset)),
          },
        },
        ...(bucketShapes.avgShape
          ? [{
              type: 'rect' as const,
              silent: true,
              shape: bucketShapes.avgShape,
              style: {
                fill: color,
              },
            }]
          : []),
      ],
    };
  };
}

/** Создает bucket-серию на тег: min..max слот и горизонтальный avg-маркер. */
export function createSeriesOptions(
  points: HistoryPoint[],
  index: number,
  label: string,
  granulate: string,
): SeriesOption[] {
  const color = SERIES_COLORS[index % SERIES_COLORS.length];

  return [
    {
      name: label,
      type: 'custom',
      data: createBucketData(points, parseGranulateMs(granulate)),
      renderItem: renderBucket(color),
      encode: {
        x: BUCKET.time,
        y: [BUCKET.avg, BUCKET.min, BUCKET.max],
      },
      itemStyle: {
        color,
      },
      emphasis: {
        disabled: true,
      },
      z: 3,
    } as SeriesOption,
  ];
}
