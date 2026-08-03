import { getAccessToken } from '../../auth/keycloak';

export type QueryParamValue = string | number | string[] | undefined;

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '');
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  return `${base}${endpoint}`;
}

function appendQueryParams(url: string, params?: Record<string, QueryParamValue>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
      return;
    }

    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `${url}?${query}` : url;
}

/** Собирает URL API из base, пути и query-параметров. */
export function buildApiUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, QueryParamValue>,
): string {
  return appendQueryParams(joinUrl(baseUrl, path), params);
}

/** Выполняет GET-запрос и добавляет query-параметры в едином формате для всех API. */
export async function getJson<T>(
  baseUrl: string,
  path: string,
  params?: Record<string, QueryParamValue>,
  init?: RequestInit,
): Promise<T> {
  const url = buildApiUrl(baseUrl, path, params);
  const headers = new Headers(init?.headers);
  const token = await getAccessToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
