import type { EChartsOption, SeriesOption } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/esm/core.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CurrentItem } from '../../entities/current/types';
import { getHistoryBatch } from '../../entities/history/api';
import { UNKNOWN_TAG_COLOR } from '../../entities/tag/color';
import { formatNumber } from '../../utils/format';
import { parseGranulateMs } from '../../utils/historyGranularity';
import { echarts } from '../history-chart/historyChartEcharts';
import { useUiSettings } from '../settings/model/settings.context';
import { createCurrentTagColors } from './model';

type LivePoint = [number, number];
type LiveSeriesByTag = Record<string, LivePoint[]>;

type CurrentLiveChartProps = {
  edgeId: string;
  getTagLabel: (tag: string) => string;
  items: CurrentItem[];
  selectedTags: string[];
};

type LiveTooltipParam = {
  marker?: string;
  seriesName?: string;
  value?: unknown;
};

type LiveTooltipPositionSize = {
  contentSize: [number, number];
  viewSize: [number, number];
};

function isNumberValue(value: CurrentItem['value']): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function trimPoints(points: LivePoint[], now: number, windowMs: number, maxPoints: number): LivePoint[] {
  const from = now - windowMs;

  return points.filter(([time]) => time >= from).slice(-maxPoints);
}

function toLiveBucket(time: number, granulateMs: number): number {
  return Math.floor(time / granulateMs) * granulateMs;
}

function hasSamePoint(points: LivePoint[], point: LivePoint): boolean {
  return points.some(([time, value]) => time === point[0] && value === point[1]);
}

function mergePoint(points: LivePoint[], point: LivePoint, now: number, windowMs: number, maxPoints: number): LivePoint[] {
  const next = points.filter(([time]) => time !== point[0]);
  next.push(point);
  next.sort((a, b) => a[0] - b[0]);

  return trimPoints(next, now, windowMs, maxPoints);
}

function mergePoints(historyPoints: LivePoint[], livePoints: LivePoint[], now: number, windowMs: number, maxPoints: number): LivePoint[] {
  const pointsByTime = new Map<number, number>();

  for (const [time, value] of historyPoints) {
    pointsByTime.set(time, value);
  }

  for (const [time, value] of livePoints) {
    pointsByTime.set(time, value);
  }

  return trimPoints(
    Array.from(pointsByTime.entries()).sort(([leftTime], [rightTime]) => leftTime - rightTime),
    now,
    windowMs,
    maxPoints,
  );
}

function getChartTags(items: CurrentItem[], selectedTags: string[]): string[] {
  if (selectedTags.length > 0) {
    return selectedTags;
  }

  return items
    .filter((item) => isNumberValue(item.value))
    .map((item) => item.tag);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTooltipPoint(param: LiveTooltipParam): LivePoint | null {
  if (!Array.isArray(param.value)) {
    return null;
  }

  const [time, value] = param.value;

  if (typeof time !== 'number' || typeof value !== 'number') {
    return null;
  }

  return [time, value];
}

function formatTooltipTime(value: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function renderLiveTooltip(params: unknown): string {
  const items = (Array.isArray(params) ? params : [params]) as LiveTooltipParam[];
  const firstPoint = items.map(getTooltipPoint).find(Boolean);
  const rows = items
    .map((item) => {
      const point = getTooltipPoint(item);

      if (!point) {
        return '';
      }

      return `
        <div class="current-live-tooltip__row">
          <span class="current-live-tooltip__name">${item.marker ?? ''}${escapeHtml(item.seriesName ?? '')}</span>
          <strong class="current-live-tooltip__value">${escapeHtml(formatNumber(point[1]))}</strong>
        </div>
      `;
    })
    .join('');

  return `
    <div class="current-live-tooltip">
      <div class="current-live-tooltip__time">${firstPoint ? escapeHtml(formatTooltipTime(firstPoint[0])) : ''}</div>
      <div class="current-live-tooltip__grid">${rows}</div>
    </div>
  `;
}

function getLiveTooltipPosition(
  _point: [number, number],
  _params: unknown,
  _dom: unknown,
  _rect: unknown,
  size: LiveTooltipPositionSize,
): [number, number] {
  const gap = 8;
  const [contentWidth] = size.contentSize;
  const [viewWidth] = size.viewSize;
  const x = Math.max(gap, (viewWidth - contentWidth) / 2);

  return [x, gap];
}

async function loadInitialSeries(edgeId: string, tags: string[], windowMs: number, granulate: string, signal: AbortSignal): Promise<LiveSeriesByTag> {
  const to = new Date();
  const from = new Date(to.getTime() - windowMs);
  const response = await getHistoryBatch(
    {
      edge: edgeId,
      tags,
      from: from.toISOString(),
      to: to.toISOString(),
      granulate,
    },
    signal,
  );

  return response.rows.reduce<LiveSeriesByTag>((acc, row) => {
    const point: LivePoint = [Date.parse(row.time), row.value];

    if (Number.isFinite(point[0]) && Number.isFinite(point[1])) {
      acc[row.tag] = [...(acc[row.tag] ?? []), point];
    }

    return acc;
  }, {});
}

export function CurrentLiveChart({ edgeId, getTagLabel, items, selectedTags }: CurrentLiveChartProps) {
  const { settings } = useUiSettings();
  const liveSettings = settings.liveChart;
  const liveWindowMs = liveSettings.windowMinutes * 60 * 1000;
  const liveGranulateMs = parseGranulateMs(liveSettings.granulate);
  const [seriesByTag, setSeriesByTag] = useState<LiveSeriesByTag>({});
  const [loading, setLoading] = useState(false);
  const [initialHistoryLoading, setInitialHistoryLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const lastLiveSnapshotRef = useRef<Record<string, string>>({});
  const initialLoadIdRef = useRef(0);
  const chartTagsKey = useMemo(() => JSON.stringify(getChartTags(items, selectedTags)), [items, selectedTags]);
  const chartTags = useMemo(() => JSON.parse(chartTagsKey) as string[], [chartTagsKey]);
  const tagColors = useMemo(() => createCurrentTagColors(items), [items]);
  const showInitialLoader = initialHistoryLoading;

  // Время двигает видимое окно графика, даже если новые SSE-точки временно не приходят.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), liveSettings.shiftIntervalMs);

    return () => window.clearInterval(timer);
  }, [liveSettings.shiftIntervalMs]);

  // История нужна только один раз при выборе набора линий: дальше график живет на current SSE.
  useEffect(() => {
    if (!edgeId || chartTags.length === 0) {
      initialLoadIdRef.current += 1;
      setSeriesByTag({});
      lastLiveSnapshotRef.current = {};
      setLoading(false);
      setInitialHistoryLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const loadId = initialLoadIdRef.current + 1;
    initialLoadIdRef.current = loadId;
    setLoading(true);
    setInitialHistoryLoading(true);

    void loadInitialSeries(edgeId, chartTags, liveWindowMs, liveSettings.granulate, controller.signal)
      .then((nextSeries) =>
        setSeriesByTag((prev) =>
          chartTags.reduce<LiveSeriesByTag>((acc, tag) => {
            acc[tag] = mergePoints(
              nextSeries[tag] ?? [],
              prev[tag] ?? [],
              Date.now(),
              liveWindowMs,
              liveSettings.maxPointsPerTag,
            );
            return acc;
          }, {}),
        ),
      )
      .catch((error: unknown) => {
        if ((error as Error).name !== 'AbortError') {
          setSeriesByTag({});
        }
      })
      .finally(() => {
        if (initialLoadIdRef.current === loadId) {
          setLoading(false);
          setInitialHistoryLoading(false);
        }
      });

    return () => controller.abort();
  }, [edgeId, chartTags, liveSettings.granulate, liveSettings.maxPointsPerTag, liveWindowMs]);

  // Новые current-значения доклеиваем в память браузера и ограничиваем настроенным окном.
  useEffect(() => {
    if (chartTags.length === 0) {
      return;
    }

    const tagSet = new Set(chartTags);
    const pointTime = toLiveBucket(Date.now(), liveGranulateMs);
    const livePoints = items
      .filter((item) => tagSet.has(item.tag) && isNumberValue(item.value))
      .filter((item) => {
        const snapshotKey = `${item.updatedAt}|${item.value}`;

        if (lastLiveSnapshotRef.current[item.tag] === snapshotKey) {
          return false;
        }

        lastLiveSnapshotRef.current[item.tag] = snapshotKey;
        return true;
      })
      .map((item) => [item.tag, [pointTime, item.value] as LivePoint] as const);

    if (livePoints.length === 0) {
      return;
    }

    setSeriesByTag((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const [tag, point] of livePoints) {
        const points = next[tag] ?? [];

        if (hasSamePoint(points, point)) {
          continue;
        }

        next[tag] = mergePoint(points, point, pointTime, liveWindowMs, liveSettings.maxPointsPerTag);
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [items, chartTags, liveGranulateMs, liveSettings.maxPointsPerTag, liveWindowMs]);

  const option = useMemo<EChartsOption>(() => {
    const series: SeriesOption[] = chartTags.map((tag) => {
      const color = tagColors[tag] ?? UNKNOWN_TAG_COLOR;
      const data = seriesByTag[tag] ?? [];

      return {
        name: getTagLabel(tag),
        type: 'line',
        data,
        showSymbol: data.length <= 1,
        symbol: 'circle',
        symbolSize: 3,
        connectNulls: false,
        sampling: 'lttb',
        lineStyle: {
          color,
          width: 1.6,
        },
        itemStyle: {
          color,
        },
        emphasis: {
          disabled: true,
        },
      };
    });

    return {
      animation: false,
      backgroundColor: 'transparent',
      grid: {
        left: 52,
        right: 24,
        top: 58,
        bottom: 36,
      },
      legend: {
        type: 'scroll',
        top: 6,
        textStyle: {
          color: '#aeb9c9',
          fontSize: 11,
        },
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        enterable: true,
        padding: 0,
        borderWidth: 0,
        backgroundColor: 'transparent',
        formatter: renderLiveTooltip,
        position: getLiveTooltipPosition,
      },
      xAxis: {
        type: 'time',
        min: now - liveWindowMs,
        max: now,
        axisLine: {
          lineStyle: { color: 'rgba(148, 163, 184, 0.45)' },
        },
        axisLabel: {
          color: '#9aa8ba',
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: {
          color: '#9aa8ba',
        },
        splitLine: {
          lineStyle: { color: 'rgba(86, 102, 126, 0.2)' },
        },
      },
      series,
    };
  }, [chartTags, getTagLabel, liveWindowMs, now, seriesByTag, tagColors]);

  if (chartTags.length === 0) {
    return (
      <div className="current-live-chart" data-testid="current-live-chart">
        <div className="current-live-chart__header">
          <span className="page-kicker">Live</span>
          <h3>Живой график текущих значений</h3>
        </div>
        <div className="current-live-chart__empty">Нет числовых показателей для графика</div>
      </div>
    );
  }

  return (
    <div className="current-live-chart" data-testid="current-live-chart">
      <div className="current-live-chart__header">
        <div>
          <span className="page-kicker">Live</span>
          <h3>Живой график текущих значений</h3>
        </div>
        <span className="current-live-chart__meta">{loading ? 'Загрузка истории...' : `${chartTags.length} линий`}</span>
      </div>
      <div className="current-live-chart__body">
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ width: '100%', height: '100%' }}
          className="current-live-chart__canvas"
          lazyUpdate
          notMerge={false}
        />
        {showInitialLoader && (
          <div className="current-live-chart__loader">
            <span className="current-live-chart__spinner" />
            <span>Загрузка и построение данных...</span>
          </div>
        )}
      </div>
    </div>
  );
}
