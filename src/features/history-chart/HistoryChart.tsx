import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { getHistoryGranularity, type HistoryAxisLabelFormat } from '../../utils/historyGranularity';
import type { DataZoomEventBatch, DataZoomState, HistoryZoomRange } from './chartTypes';
import { HistoryChartArea } from './HistoryChartArea';
import { createHistoryChartOptions } from './historyChartOptions';
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

const ZOOM_REQUEST_DELAY_MS = 350;

function isXAxisDataZoom(state: DataZoomState): boolean {
  return state.dataZoomId?.startsWith('history-x-') || state.dataZoomIndex === 0 || state.dataZoomIndex === 1;
}

/** Собирает начальный zoom-диапазон из внешних props графика. */
function createInitialZoomRange({
  from,
  granulate,
  labelFormat,
  tickIntervalMs,
  to,
}: Pick<HistoryChartProps, 'from' | 'granulate' | 'labelFormat' | 'tickIntervalMs' | 'to'>): HistoryZoomRange {
  return { from, to, granulate, labelFormat, tickIntervalMs };
}

/** Создает zoom-диапазон из миллисекунд и подбирает для него грануляцию. */
function createZoomRange(fromMs: number, toMs: number): HistoryZoomRange {
  const from = new Date(fromMs).toISOString();
  const to = new Date(toMs).toISOString();

  return {
    from,
    to,
    ...getHistoryGranularity(from, to),
  };
}

/** Достает подинтервал X-зума из события ECharts. */
function getZoomRangeFromEvent(state: DataZoomState, baseRange: HistoryZoomRange): HistoryZoomRange | null {
  const baseFromMs = new Date(baseRange.from).getTime();
  const baseToMs = new Date(baseRange.to).getTime();
  const baseSpanMs = baseToMs - baseFromMs;

  if (!Number.isFinite(baseFromMs) || !Number.isFinite(baseToMs) || baseSpanMs <= 0) {
    return null;
  }

  const startValue = Number(state.startValue);
  const endValue = Number(state.endValue);
  let nextFromMs = Number.isFinite(startValue) ? startValue : undefined;
  let nextToMs = Number.isFinite(endValue) ? endValue : undefined;
  
  // ECharts иногда не передает startValue/endValue, поэтому используем start/end.
  if (nextFromMs === undefined || nextToMs === undefined) {
    const start = Number(state.start);
    const end = Number(state.end);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return null;
    }

    nextFromMs = baseFromMs + (baseSpanMs * start) / 100;
    nextToMs = baseFromMs + (baseSpanMs * end) / 100;
  }

  // Проверка на выход из диапазона 
  const fromMs = Math.max(baseFromMs, Math.min(nextFromMs, nextToMs));
  const toMs = Math.min(baseToMs, Math.max(nextFromMs, nextToMs));

  return toMs > fromMs ? createZoomRange(fromMs, toMs) : null;
}

/** Проверяет, что lazy zoom не пытается повторно применить тот же диапазон. */
function isSameZoomRange(left: HistoryZoomRange, right: HistoryZoomRange): boolean {
  return left.from === right.from && left.to === right.to && left.granulate === right.granulate;
}

/** Вычисляет, какую часть верхнеуровневого периода занимает текущий пользовательский zoom. */
function createDataZoomState(baseRange: HistoryZoomRange, zoomRange: HistoryZoomRange): DataZoomState {
  // Верхнеуровневый период берём из инпутов "С/По" и считаем его полными 0..100%.
  const baseFromMs = new Date(baseRange.from).getTime();
  const baseToMs = new Date(baseRange.to).getTime();

  // Пользовательский zoom живёт внутри верхнеуровневого периода и должен быть выделен на нижней шкале.
  const zoomFromMs = new Date(zoomRange.from).getTime();
  const zoomToMs = new Date(zoomRange.to).getTime();
  const baseSpanMs = baseToMs - baseFromMs;

  // Если даты некорректны, показываем весь период, чтобы не ломать управление графиком.
  if (
    !Number.isFinite(baseFromMs) ||
    !Number.isFinite(baseToMs) ||
    !Number.isFinite(zoomFromMs) ||
    !Number.isFinite(zoomToMs) ||
    baseSpanMs <= 0
  ) {
    return { start: 0, end: 100 };
  }

  // Переводим абсолютные даты zoom-а в проценты относительно верхнеуровневого периода.
  const start = ((zoomFromMs - baseFromMs) / baseSpanMs) * 100;
  const end = ((zoomToMs - baseFromMs) / baseSpanMs) * 100;

  // Ограничиваем значения диапазоном 0..100, чтобы ECharts не получил выход за шкалу.
  return {
    start: Math.max(0, Math.min(100, start)),
    end: Math.max(0, Math.min(100, end)),
  };
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
  const lines = useHistoryChartQueries({
    edge,
    from: zoomRange.from,
    granulate: zoomRange.granulate,
    tags,
    to: zoomRange.to,
    tagLabels,
  });
  const series = useHistoryChartSeries(lines, zoomRange.granulate);
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
      option={displayOption}
      onDataZoom={handleDataZoom}
    />
  );
}
