export type QueryParamValue = string | number | string[] | undefined;

/** Выполняет GET-запрос и добавляет query-параметры в едином формате для всех API. */
export async function getJson<T>(
  baseUrl: string,
  path: string,
  params?: Record<string, QueryParamValue>,
  init?: RequestInit,
): Promise<T> {
  const url = new URL(path, baseUrl);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, item));
      return;
    }

    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
