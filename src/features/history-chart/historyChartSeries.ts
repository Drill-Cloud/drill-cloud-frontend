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

type CartesianCoordSys = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function isFinitePoint(point: HistoryPoint): boolean {
  return [point.avg_value, point.min_value, point.max_value].every(Number.isFinite);
}

/** Упаковывает один bucket API в компактный tuple для custom series ECharts. */
function createBucketData(points: HistoryPoint[], slotMs: number): HistoryBucketValue[] {
  return points.filter(isFinitePoint).map((point) => [
    new Date(point.time).getTime(),
    point.avg_value,
    point.min_value,
    point.max_value,
    point.point_count,
    slotMs,
  ]);
}

/** Рисует один bucket как временной слот: затухающий min..max и яркий маркер avg. */
function renderBucket(color: string) {
  return (params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI): CustomSeriesRenderItemReturn => {
    const time = Number(api.value(0));
    const avg = Number(api.value(1));
    const min = Number(api.value(2));
    const max = Number(api.value(3));
    const slotMs = Number(api.value(5));

    // ECharts отдает размеры области графика в runtime, но в публичных типах
    // они не описаны. Поэтому держим cast локально рядом с clipping-логикой.
    const coordSys = params.coordSys as unknown as CartesianCoordSys;

    // Переводим координаты данных (time/value) в пиксели canvas.
    const avgPoint = api.coord([time, avg]);
    const minPoint = api.coord([time, min]);
    const maxPoint = api.coord([time, max]);
    const slotStart = api.coord([time - slotMs / 2, avg]);
    const slotEnd = api.coord([time + slotMs / 2, avg]);

    // Слот занимает один интервал грануляции по X и диапазон min..max по Y.
    const x = Math.min(slotStart[0], slotEnd[0]);
    const rawHeight = Math.abs(maxPoint[1] - minPoint[1]);
    const width = Math.max(2, Math.abs(slotEnd[0] - slotStart[0]));
    const height = Math.max(2, rawHeight);
    const y = Math.min(minPoint[1], maxPoint[1]) - (height - rawHeight) / 2;
    const avgY = avgPoint[1];
    const chartArea = { x: coordSys.x, y: coordSys.y, width: coordSys.width, height: coordSys.height };

    // Обрезаем фигуры, чтобы при Y-зуме они не выходили за область графика.
    const rangeShape = graphic.clipRectByRect(
      { x, y, width, height },
      chartArea,
    );
    const avgShape = graphic.clipRectByRect(
      { x, y: avgY - 1, width, height: 2 },
      chartArea,
    );

    if (!rangeShape) {
      return null;
    }

    return {
      type: 'group',
      children: [
        {
          type: 'rect',
          shape: rangeShape,
          style: {
            fill: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${color}00` },
              { offset: 0.5, color: `${color}66` },
              { offset: 1, color: `${color}00` },
            ]),
          },
        },
        ...(avgShape ? [{
          type: 'rect' as const,
          shape: avgShape,
          style: {
            fill: color,
          },
        }] : []),
      ],
    };
  };
}

/** Создает отдельный временной слот min..max с акцентом на avg для каждой точки history. */
export function createSeriesOptions(points: HistoryPoint[], index: number, label: string, granulate: string): SeriesOption[] {
  const color = SERIES_COLORS[index % SERIES_COLORS.length];
  const data = createBucketData(points, parseGranulateMs(granulate));

  return [
    {
      name: label,
      type: 'custom',
      data,
      renderItem: renderBucket(color),
      encode: {
        x: 0,
        y: [1, 2, 3],
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
