import { getHistoryGranularity } from '../../utils/historyGranularity';
import type { DataZoomState, HistoryZoomRange } from './chartTypes';

export const ZOOM_REQUEST_DELAY_MS = 180;

export function isXAxisDataZoom(state: DataZoomState): boolean {
  return state.dataZoomId?.startsWith('history-x-') || state.dataZoomIndex === 0 || state.dataZoomIndex === 1;
}

/** Собирает начальный zoom-диапазон из внешних props графика. */
export function createInitialZoomRange(range: HistoryZoomRange): HistoryZoomRange {
  return range;
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
export function getZoomRangeFromEvent(state: DataZoomState, baseRange: HistoryZoomRange): HistoryZoomRange | null {
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

  // ECharts иногда не передает startValue/endValue, поэтому используем проценты start/end.
  if (nextFromMs === undefined || nextToMs === undefined) {
    const start = Number(state.start);
    const end = Number(state.end);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return null;
    }

    nextFromMs = baseFromMs + (baseSpanMs * start) / 100;
    nextToMs = baseFromMs + (baseSpanMs * end) / 100;
  }

  const fromMs = Math.max(baseFromMs, Math.min(nextFromMs, nextToMs));
  const toMs = Math.min(baseToMs, Math.max(nextFromMs, nextToMs));

  return toMs > fromMs ? createZoomRange(fromMs, toMs) : null;
}

/** Проверяет, что lazy zoom не пытается повторно применить тот же диапазон. */
export function isSameZoomRange(left: HistoryZoomRange, right: HistoryZoomRange): boolean {
  return left.from === right.from && left.to === right.to && left.granulate === right.granulate;
}

/** Вычисляет, какую часть верхнеуровневого периода занимает текущий пользовательский zoom. */
export function createDataZoomState(baseRange: HistoryZoomRange, zoomRange: HistoryZoomRange): DataZoomState {
  // Верхнеуровневый период берем из инпутов "С/По" и считаем его полными 0..100%.
  const baseFromMs = new Date(baseRange.from).getTime();
  const baseToMs = new Date(baseRange.to).getTime();

  // Пользовательский zoom живет внутри верхнеуровневого периода и выделяется на нижней шкале.
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
