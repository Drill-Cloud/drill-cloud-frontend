import { getJson } from '../../shared/api/http';
import { cloudApiUrl } from '../../shared/config/env';
import type { EdgeResponse } from './types';

/** Возвращает список установок, доступных в cloud-v3. */
export function getEdges(): Promise<EdgeResponse> {
  return getJson<EdgeResponse>(cloudApiUrl, '/edge');
}
