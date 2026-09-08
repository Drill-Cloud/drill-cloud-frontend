import type { LineSeriesOption, SeriesOption } from 'echarts';
import type { HistoryPoint } from '../../entities/history/types';
import { parseGranulateMs } from '../../utils/historyGranularity';

type AvgLineSeriesValue = [time: number, avg: number, min: number, max: number, count: number, slotMs: number];
type AvgLineSeriesPoint = AvgLineSeriesValue | null;

function isFinitePoint(point: HistoryPoint): boolean {
  return [point.avg_value, point.min_value, point.max_value].every(Number.isFinite);
}

function createAvgLineData(points: HistoryPoint[], granulate: string, breakOnGaps: boolean): AvgLineSeriesPoint[] {
  const slotMs = parseGranulateMs(granulate);
  const finitePoints = points.filter(isFinitePoint);

  if (!breakOnGaps) {
    return finitePoints.map((point) => [
      new Date(point.time).getTime(),
      point.avg_value,
      point.min_value,
      point.max_value,
      point.point_count,
      slotMs,
    ]);
  }

  return finitePoints.flatMap((point, index) => {
    const currentTime = new Date(point.time).getTime();
    const currentPoint: AvgLineSeriesValue = [
      currentTime,
      point.avg_value,
      point.min_value,
      point.max_value,
      point.point_count,
      slotMs,
    ];

    if (index === 0) {
      return [currentPoint];
    }

    const previousTime = new Date(finitePoints[index - 1].time).getTime();
    const hasAcceptableGap = currentTime - previousTime <= slotMs * 50;

    return hasAcceptableGap ? [currentPoint] : [null, currentPoint];
  });
}

export function createAvgLineSeries(
  points: HistoryPoint[],
  color: string,
  label: string,
  granulate: string,
  showAvgLine: boolean,
  breakOnGaps: boolean,
): SeriesOption[] {
  if (!showAvgLine) {
    return [];
  }

  return [
    {
      name: label,
      type: 'line',
      data: createAvgLineData(points, granulate, breakOnGaps),
      encode: {
        x: 0,
        y: 1,
      },
      smooth: true,
      connectNulls: false,
      showSymbol: false,
      symbol: 'none',
      silent: true,
      tooltip: {
        show: false,
      },
      lineStyle: {
        color,
        width: 1.5,
        opacity: 0.78,
      },
      emphasis: {
        disabled: true,
      },
      z: 4,
    } as LineSeriesOption,
  ];
}
