import type { HistoryAxisLabelFormat } from '../../utils/historyGranularity';
import type { AvgPointValue, TooltipParam } from './chartTypes';

export function formatAxisDate(value: number, labelFormat: HistoryAxisLabelFormat = 'time-minutes'): string {
  const date = new Date(value);

  if (labelFormat === 'time-seconds') {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }

  if (labelFormat === 'time-minutes') {
    return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date);
  }

  if (labelFormat === 'hour-zero') {
    return `${new Intl.DateTimeFormat('ru-RU', { hour: '2-digit' }).format(date)}:00`;
  }

  if (labelFormat === 'day-hour') {
    const day = new Intl.DateTimeFormat('ru-RU', { day: '2-digit' }).format(date);
    const hour = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit' }).format(date);
    return `${day} ${hour}:00`;
  }

  if (labelFormat === 'weekday-day') {
    return new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: '2-digit' }).format(date);
  }

  if (labelFormat === 'day-month') {
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(date);
  }

  if (labelFormat === 'day-month-name') {
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(date);
  }

  if (labelFormat === 'month-name') {
    return new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(date);
  }

  if (labelFormat === 'month-year') {
    return new Intl.DateTimeFormat('ru-RU', { month: 'short', year: '2-digit' }).format(date);
  }

  if (labelFormat === 'quarter-year') {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Кв${quarter} ${String(date.getFullYear()).slice(-2)}`;
  }

  return new Intl.DateTimeFormat('ru-RU', { year: 'numeric' }).format(date);
}

function formatChartValue(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits:
      Math.abs(value) >= 1000 ? 0
      : Math.abs(value) >= 100 ? 1
      : Math.abs(value) >= 10 ? 2
      : Math.abs(value) >= 1 ? 3
      : 4,
  }).format(value);
}

/** Форматирует полную дату и время для начала/конца интервала в tooltip. */
function formatTooltipDateTime(value: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

/** Форматирует только время, когда конец интервала находится в тот же день. */
function formatTooltipTime(value: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

/** Проверяет, можно ли показать конец интервала без повторения даты. */
function isSameDate(first: number, second: number): boolean {
  const firstDate = new Date(first);
  const secondDate = new Date(second);

  return (
    firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate()
  );
}

/** Показывает bucket графика как интервал текущей грануляции, а не как одну точку времени. */
function formatTooltipInterval(value: AvgPointValue): string {
  const time = value[0];
  const slotMs = value[5];

  if (!slotMs) {
    return formatTooltipDateTime(time);
  }

  const from = time - slotMs / 2;
  const to = time + slotMs / 2;

  if (isSameDate(from, to)) {
    return `${formatTooltipDateTime(from)} — ${formatTooltipTime(to)}`;
  }

  return `${formatTooltipDateTime(from)} — ${formatTooltipDateTime(to)}`;
}

/** Форматирует значение tooltip: одно число для min=avg=max или среднее с диапазоном. */
function formatTooltipValue(value: AvgPointValue): string {
  const avg = formatChartValue(value[1]);
  const min = formatChartValue(value[2]);
  const max = formatChartValue(value[3]);

  if (min === avg && avg === max) {
    return avg;
  }

  return `сред. ${avg} (${min} .. ${max})`;
}

function isAvgPointValue(value: unknown): value is AvgPointValue {
  return Array.isArray(value) && value.length >= 5 && value.every((item) => typeof item === 'number');
}

/** Собирает tooltip с min/avg/max для основной avg-серии. */
export function formatTooltip(params: unknown): string {
  const items = (Array.isArray(params) ? params : [params]).filter(
    (item): item is TooltipParam => typeof item === 'object' && item !== null,
  );
  const avgItems = items.filter((item) => isAvgPointValue(item.value));
  const firstValue = avgItems[0]?.value as AvgPointValue | undefined;

  if (!firstValue) {
    return '';
  }

  const time = firstValue[0];
  const header = formatTooltipDateTime(time);

  const rows = avgItems.map((item) => {
    const value = item.value as AvgPointValue;
    return [
      '<div class="chart-tooltip-row">',
      `<span class="chart-tooltip-label" style="--chart-tooltip-marker-color:${item.color ?? 'currentColor'};">${item.seriesName ?? ''}</span>`,
      '<strong>',
      formatChartValue(value[1]),
      '</strong>',
      '</div>',
    ].join('');
  });

  return [`<div class="chart-tooltip"><div class="chart-tooltip-title">${header}</div>`, ...rows, '</div>'].join('');
}
