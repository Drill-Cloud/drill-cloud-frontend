import { toInputDateTimeValue } from '../../utils/format';

export type DateRangeState = {
  from: string;
  to: string;
};

export const RANGE_PRESETS = [
  { id: '1h', label: '1 час', hours: 1 },
  { id: '6h', label: '6 часов', hours: 6 },
  { id: '24h', label: '24 часа', hours: 24 },
  { id: '7d', label: '7 дней', hours: 24 * 7 },
  { id: '30d', label: '30 дней', hours: 24 * 30 },
] as const;

export function createRange(hours: number): DateRangeState {
  const to = new Date();
  const from = new Date(to.getTime() - hours * 60 * 60 * 1000);
  return {
    from: toInputDateTimeValue(from),
    to: toInputDateTimeValue(to),
  };
}
