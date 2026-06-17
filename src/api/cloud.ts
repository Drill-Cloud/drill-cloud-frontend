const API_URL = import.meta.env.VITE_CLOUD_API_URL ?? 'http://localhost:3100';

export type HealthResponse = {
  status: 'ok';
  database: {
    now: string;
    timescaledb_installed: boolean;
    timescaledb_version: string | null;
  };
};

export type CurrentItem = {
  edge: string;
  tag: string;
  value: number;
  time: string;
  updatedAt: string;
};

export type CurrentResponse = {
  edge: string;
  items: CurrentItem[];
};

export type CurrentEvent = CurrentResponse;

export type EdgeItem = {
  id: string;
  name: string;
  tagCount: number;
  currentTagCount: number;
  liveTagCount: number;
  lastDataAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EdgeResponse = {
  items: EdgeItem[];
};

export type HistoryPoint = {
  t: number;
  v: number;
  first?: number;
  min?: number;
  max?: number;
  avg?: number;
  last?: number;
  count?: number;
};

export type HistorySeries = {
  edge: string;
  tag: string;
  points: HistoryPoint[];
};

export type HistoryResponse = {
  edge: string;
  source: 'empty' | 'latest' | 'raw' | '1m' | '5m' | '1h' | '1d';
  targetPoints: number;
  series: HistorySeries[];
  from?: string;
  to?: string;
  resolutionSeconds?: number | null;
  valueMode?: 'raw' | 'avg' | 'last' | 'first' | 'min' | 'max';
};

/** Выполняет типизированный GET-запрос к cloud-v2 и централизованно обрабатывает ошибки HTTP. */
async function request<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(path, API_URL);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/** Запрашивает состояние cloud-v2 и подключенной базы данных. */
export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}

/** Возвращает список edge-установок, доступных в cloud-v2. */
export function getEdges(): Promise<EdgeResponse> {
  return request<EdgeResponse>('/edge');
}

/** Загружает текущие значения показателей для выбранного edge. */
export function getCurrent(edge: string, tags?: string[]): Promise<CurrentResponse> {
  return request<CurrentResponse>('/current', {
    edge,
    tags: tags?.join(','),
  });
}

/** Формирует URL SSE-потока для live-обновлений текущих значений. */
export function getCurrentEventsUrl(edge: string, tags?: string[]): string {
  const url = new URL('/current/events', API_URL);
  url.searchParams.set('edge', edge);

  if (tags?.length) {
    url.searchParams.set('tags', tags.join(','));
  }

  return url.toString();
}

/** Запрашивает исторические ряды для графика с учетом диапазона, тегов и режима агрегации. */
export function getHistory(params: {
  edge: string;
  tags?: string[];
  from?: string;
  to?: string;
  targetPoints?: number;
  valueMode?: 'avg' | 'last' | 'first' | 'min' | 'max';
}): Promise<HistoryResponse> {
  return request<HistoryResponse>('/history', {
    edge: params.edge,
    tags: params.tags?.join(','),
    from: params.from,
    to: params.to,
    targetPoints: params.targetPoints,
    valueMode: params.valueMode,
  });
}
