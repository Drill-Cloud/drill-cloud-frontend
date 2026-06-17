const DEFAULT_TOIR_ORIGIN = 'https://toir-light.greact.ru';

/** Возвращает origin встроенного TOиР-приложения с безопасной нормализацией слеша. */
export function getToirLightOrigin(): string {
  return (import.meta.env.VITE_TOIR_LIGHT_ORIGIN ?? DEFAULT_TOIR_ORIGIN).replace(/\/$/, '');
}

/** Определяет targetOrigin для postMessage в iframe TOиР. */
export function getToirLightPostMessageTarget(): string {
  return getToirLightOrigin();
}

/** Собирает полный URL iframe TOиР и передает тему через query-параметр. */
export function buildToirLightUrl(path: string, theme = 'dark'): string {
  const origin = getToirLightOrigin();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(normalizedPath, `${origin}/`);
  url.searchParams.set('theme', theme);
  return url.toString();
}
