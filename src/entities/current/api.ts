import { buildApiUrl, getJson } from '../../shared/api/http';
import { cloudApiUrl } from '../../shared/config/env';
import type { CurrentResponse } from './types';

/** Загружает текущие значения показателей для выбранной буровой. */
export function getCurrent(edge: string, tags?: string[]): Promise<CurrentResponse> {
  return getJson<CurrentResponse>(cloudApiUrl, '/current', { edge, tags });
}

/** Формирует URL SSE-потока текущих значений. */
export function getCurrentEventsUrl(edge: string, tags?: string[], accessToken?: string): string {
  return buildApiUrl(cloudApiUrl, '/current/events', { edge, tags, access_token: accessToken });
}
