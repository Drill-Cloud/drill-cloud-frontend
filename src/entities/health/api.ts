import { getJson } from '../../shared/api/http';
import { cloudApiUrl } from '../../shared/config/env';
import type { HealthResponse } from './types';

/** Запрашивает состояние cloud-v3 и подключенной базы данных. */
export function getHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>(cloudApiUrl, '/health');
}
