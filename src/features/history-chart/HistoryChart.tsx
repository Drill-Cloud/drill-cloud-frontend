import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { parseGranulateMs, type HistoryAxisLabelFormat } from '../../utils/historyGranularity';
import type { AvgLineMode, DataZoomEventBatch, HistoryZoomRange } from './chartTypes';
import { HistoryChartArea } from './HistoryChartArea';
import { createHistoryChartOptions } from './historyChartOptions';
import {
  createDataZoomState,
  createInitialZoomRange,
  getZoomRangeFromEvent,
  isSameZoomRange,
  isXAxisDataZoom,
  ZOOM_REQUEST_DELAY_MS,
} from './historyChartZoom';
import { useHistoryChartQueries } from './useHistoryChartQueries';
import { useHistoryChartSeries } from './useHistoryChartSeries';

type HistoryChartProps = {
  edge: string;
  from: string;
  granulate: string;
  labelFormat?: HistoryAxisLabelFormat;
  tags: string[];
  tickIntervalMs?: number;
  to: string;
  tagLabels?: Record<string, string>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Определяет видимость соединительной avg-линии с учетом ручного режима и текущей грануляции. */
function shouldShowAvgLine(mode: AvgLineMode, granulate: string): boolean {
  if (mode === 'show') {
    return true;
  }

  if (mode === 'hide') {
    return false;
  }

  return parseGranulateMs(granulate) < DAY_MS;
}

export function HistoryChart({
  edge,
  from,
  granulate,
  labelFormat,
  tags,
  tickIntervalMs,
  to,
  tagLabels = {},
}: HistoryChartProps) {
  const baseRange = useMemo(
    () => createInitialZoomRange({ from, granulate, labelFormat, tickIntervalMs, to }),
    [from, granulate, labelFormat, tickIntervalMs, to],
  );
  const [zoomRange, setZoomRange] = useState(() =>
    createInitialZoomRange({ from, granulate, labelFormat, tickIntervalMs, to }),
  );
  const baseRangeRef = useRef(baseRange);
  const zoomRangeRef = useRef(zoomRange);
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReadyOptionRef = useRef<EChartsOption | null>(null);
  const [avgLineMode, setAvgLineMode] = useState<AvgLineMode>('auto');
  const lines = useHistoryChartQueries({
    edge,
    from: zoomRange.from,
    granulate: zoomRange.granulate,
    tags,
    to: zoomRange.to,
    tagLabels,
  });
  const showAvgLine = shouldShowAvgLine(avgLineMode, zoomRange.granulate);
  const series = useHistoryChartSeries(lines, zoomRange.granulate, showAvgLine);
  const legendData = useMemo(() => lines.map((line) => line.label), [lines]);
  const loading = lines.some((line) => line.loading);
  const hasData = series.length > 0;

  useEffect(() => {
    baseRangeRef.current = baseRange;
    zoomRangeRef.current = baseRange;
    setZoomRange(baseRange);
  }, [baseRange]);

  useEffect(() => {
    zoomRangeRef.current = zoomRange;
  }, [zoomRange]);

  useEffect(
    () => () => {
      if (zoomTimerRef.current) {
        clearTimeout(zoomTimerRef.current);
      }
    },
    [],
  );

  const option = useMemo(
    () =>
      createHistoryChartOptions({
        dataZoomState: createDataZoomState(baseRange, zoomRange),
        from: baseRange.from,
        to: baseRange.to,
        labelFormat: zoomRange.labelFormat,
        legendData,
        series,
        tickIntervalMs: zoomRange.tickIntervalMs,
      }),
    [baseRange, legendData, series, zoomRange],
  );

  // Во время lazy-загрузки нового zoom-диапазона оставляем на экране последний готовый график.
  // Так canvas не заменяется loader-ом и пользователь не теряет визуальный контекст.
  const fallbackOption = loading && !hasData ? lastReadyOptionRef.current : null;
  const displayOption = fallbackOption ?? option;
  const displayHasData = hasData || Boolean(fallbackOption);

  useEffect(() => {
    if (hasData) {
      lastReadyOptionRef.current = option;
    }
  }, [hasData, option]);

  const handleDataZoom = useCallback((event: DataZoomEventBatch) => {
    const state = (event.batch ?? [event]).find(isXAxisDataZoom);

    if (!state) {
      return;
    }

    const baseRange = baseRangeRef.current;
    const currentRange = zoomRangeRef.current;
    const nextRange = getZoomRangeFromEvent(state, baseRange);

    if (!nextRange || isSameZoomRange(nextRange, currentRange)) {
      return;
    }

    if (zoomTimerRef.current) {
      clearTimeout(zoomTimerRef.current);
    }

    zoomTimerRef.current = setTimeout(() => {
      zoomRangeRef.current = nextRange;
      setZoomRange(nextRange);
    }, ZOOM_REQUEST_DELAY_MS);
  }, []);

  return (
    <HistoryChartArea
      hasData={displayHasData}
      hasSelection={tags.length > 0}
      loading={loading}
      avgLineMode={avgLineMode}
      option={displayOption}
      onDataZoom={handleDataZoom}
      onAvgLineModeChange={setAvgLineMode}
    />
  );
}
