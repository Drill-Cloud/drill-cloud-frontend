import { getJson } from '../../shared/api/http';
import { cloudApiUrl } from '../../shared/config/env';
import type { HistoryBatchRequest, HistoryBatchResponse, HistoryRequest, HistoryResponse } from './types';

/** Запрашивает исторический ряд с avg-линией и min/max-диапазоном для графика. */
export function getHistory(params: HistoryRequest, signal?: AbortSignal): Promise<HistoryResponse> {
  return getJson<HistoryResponse>(cloudApiUrl, '/history', params, { signal });
}

/** Запрашивает короткую историю сразу по нескольким тегам для live-графика показателей. */
export function getHistoryBatch(params: HistoryBatchRequest, signal?: AbortSignal): Promise<HistoryBatchResponse> {
  return getJson<HistoryBatchResponse>(
    cloudApiUrl,
    '/history/batch',
    {
      edge: params.edge,
      tags: params.tags.join(','),
      from: params.from,
      to: params.to,
      granulate: params.granulate,
    },
    { signal },
  );
}
