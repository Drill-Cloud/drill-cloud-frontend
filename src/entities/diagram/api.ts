import { getAccessToken } from '../../auth/keycloak';
import { getJson } from '../../shared/api/http';
import { diagramApiUrl } from '../../shared/config/env';
import type { DiagramPageResponse, DiagramPageSummary } from './types';

/** Выполняет запрос к diagram-service и пробрасывает Bearer-токен, если UI работает с SSO. */
async function request<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const token = await getAccessToken();
  return getJson<T>(diagramApiUrl, path, params, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/** Возвращает список страниц схем; опубликованность определяется по publishedRevision. */
export function listDiagramPages(ownerEdgeId?: string): Promise<DiagramPageSummary[]> {
  return request<DiagramPageSummary[]>('/diagram/pages', { ownerEdgeId });
}

/** Загружает опубликованную версию страницы схемы. */
export function getPublishedDiagramPage(pageKey: string): Promise<DiagramPageResponse> {
  return request<DiagramPageResponse>(`/diagram/pages/${encodeURIComponent(pageKey)}/published`);
}
