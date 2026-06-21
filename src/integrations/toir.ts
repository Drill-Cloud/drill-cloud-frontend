import { toirLightOrigin } from '../shared/config/env';

/** Возвращает origin встроенного ТОиР-приложения из Vite env. */
export function getToirLightOrigin(): string {
  return toirLightOrigin;
}

/** Определяет targetOrigin для postMessage в iframe ТОиР. */
export function getToirLightPostMessageTarget(): string {
  return getToirLightOrigin();
}

/** Собирает полный URL iframe ТОиР и передает тему через query-параметр. */
export function buildToirLightUrl(path: string, theme = 'dark'): string {
  const origin = getToirLightOrigin();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(normalizedPath, `${origin}/`);
  url.searchParams.set('theme', theme);
  return url.toString();
}
