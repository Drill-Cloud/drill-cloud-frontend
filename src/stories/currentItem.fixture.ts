import type { CurrentItem } from '../entities/current/types';

const FIXED_TIME = '2026-08-27T09:30:00.000Z';

/** Создаёт полное показание тега для stories без обращения к API. */
export function createCurrentItem(overrides: Partial<CurrentItem> = {}): CurrentItem {
  return {
    edge: 'dev',
    tag: 'edge5-v3-wk',
    value: 34.7,
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME,
    time: FIXED_TIME,
    name: 'Вес на крюке',
    tagGroup: 'Бурение',
    min: 0,
    max: 50,
    comment: 'Текущий вес бурильной колонны на крюке',
    unitOfMeasurement: 'т',
    precision: 1,
    color: '#FACC15',
    ...overrides,
  };
}
