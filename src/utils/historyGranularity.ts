export type HistoryAxisLabelFormat =
  | 'time-seconds'
  | 'time-minutes'
  | 'hour-zero'
  | 'day-hour'
  | 'weekday-day'
  | 'day-month'
  | 'day-month-name'
  | 'month-name'
  | 'month-year'
  | 'quarter-year'
  | 'year';

export type HistoryGranularity = {
  granulate: string;
  tickIntervalMs: number;
  labelFormat: HistoryAxisLabelFormat;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const GRANULATE_UNIT_MS: Record<string, number> = {
  second: SECOND,
  seconds: SECOND,
  minute: MINUTE,
  minutes: MINUTE,
  hour: HOUR,
  hours: HOUR,
  day: DAY,
  days: DAY,
  week: WEEK,
  weeks: WEEK,
};

type Rule = {
  maxMs: number;
  granulate: string;
  tickIntervalMs: number;
  labelFormat: HistoryAxisLabelFormat;
};

const RULES: Rule[] = [
  { maxMs: 15 * MINUTE, granulate: '1 second', tickIntervalMs: MINUTE, labelFormat: 'time-seconds' },
  { maxMs: HOUR, granulate: '5 seconds', tickIntervalMs: 5 * MINUTE, labelFormat: 'time-minutes' },
  { maxMs: 3 * HOUR, granulate: '10 seconds', tickIntervalMs: 15 * MINUTE, labelFormat: 'time-minutes' },
  { maxMs: 6 * HOUR, granulate: '30 seconds', tickIntervalMs: 30 * MINUTE, labelFormat: 'time-minutes' },
  { maxMs: 12 * HOUR, granulate: '1 minute', tickIntervalMs: HOUR, labelFormat: 'hour-zero' },
  { maxMs: 3 * DAY, granulate: '5 minutes', tickIntervalMs: 6 * HOUR, labelFormat: 'day-hour' },
  { maxMs: 7 * DAY, granulate: '10 minutes', tickIntervalMs: DAY, labelFormat: 'weekday-day' },
  { maxMs: 10 * DAY, granulate: '15 minutes', tickIntervalMs: DAY, labelFormat: 'day-month' },
  { maxMs: 3 * WEEK, granulate: '30 minutes', tickIntervalMs: 2 * DAY, labelFormat: 'day-month' },
  { maxMs: 6 * WEEK, granulate: '1 hour', tickIntervalMs: WEEK, labelFormat: 'day-month' },
  { maxMs: 4 * MONTH, granulate: '3 hours', tickIntervalMs: 2 * WEEK, labelFormat: 'day-month-name' },
  { maxMs: 8 * MONTH, granulate: '6 hours', tickIntervalMs: MONTH, labelFormat: 'month-name' },
  { maxMs: 1.5 * YEAR, granulate: '12 hours', tickIntervalMs: MONTH, labelFormat: 'month-year' },
  { maxMs: 3 * YEAR, granulate: '1 day', tickIntervalMs: 3 * MONTH, labelFormat: 'quarter-year' },
];

/** Подбирает шаг данных и подписи X по длительности выбранного диапазона. */
export function getHistoryGranularity(from: string, to: string): HistoryGranularity {
  const spanMs = new Date(to).getTime() - new Date(from).getTime();
  return (
    RULES.find((rule) => spanMs <= rule.maxMs) ?? {
      granulate: '1 week',
      tickIntervalMs: YEAR,
      labelFormat: 'year',
    }
  );
}

/** Переводит текст грануляции API вроде "10 minutes" в миллисекунды. */
export function parseGranulateMs(granulate: string): number {
  const [amountText, unit = ''] = granulate.trim().split(/\s+/);
  const amount = Number(amountText);
  const unitMs = GRANULATE_UNIT_MS[unit.toLowerCase()];

  return Number.isFinite(amount) && unitMs ? amount * unitMs : MINUTE;
}
