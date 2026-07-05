import { getJson } from '../../shared/api/http';
import { cloudApiUrl } from '../../shared/config/env';
import type { HistoryRequest, HistoryResponse } from './types';

/** Запрашивает исторический ряд с avg-линией и min/max-диапазоном для графика. */
export function getHistory(params: HistoryRequest, signal?: AbortSignal): Promise<HistoryResponse> {
  return getJson<HistoryResponse>(cloudApiUrl, '/history', params, { signal });
}
