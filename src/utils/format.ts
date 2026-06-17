/** Форматирует числовое значение показателя для карточек и мини-плиток. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }

  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: Math.abs(value) >= 100 ? 1 : 3,
  }).format(value);
}

/** Приводит дату/время к короткому русскому формату для операторского интерфейса. */
export function formatDateTime(value: string | number | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

/** Конвертирует Date в формат, который ожидает input[type="datetime-local"]. */
export function toInputDateTimeValue(date: Date): string {
  /** Дополняет часть даты ведущим нулем для стабильного input-формата. */
  const pad = (part: number) => String(part).padStart(2, '0');
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join('T');
}

/** Преобразует значение datetime-local в ISO-строку для API-запросов. */
export function toIsoFromInput(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
