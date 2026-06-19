const API_URL = import.meta.env.VITE_CLOUD_API_URL ?? 'http://localhost:3101';

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
  createdAt: string;
  updatedAt: string;
  time: string;
  name: string | null;
  tagGroup: string | null;
  min: number | null;
  max: number | null;
  comment: string | null;
  unitOfMeasurement: string | null;
  precision: number | null;
};

export type CurrentResponse = {
  edge: string;
  items: CurrentItem[];
};

export type CurrentEvent = CurrentResponse;

export type EdgeItem = {
  id: string;
  name: string;
  parentId: string | null;
  tagIds: string[];
  tagCount: number;
  currentTagCount: number;
  liveTagCount: number;
  lastDataAt: string | null;
};

export type EdgeResponse = {
  items: EdgeItem[];
};

export type TagItem = {
  id: string;
  name: string;
  tagGroup: string | null;
  min: number;
  max: number;
  comment: string;
  unitOfMeasurement: string;
  edgeIds: string[];
  precision: number | null;
};

export type TagResponse = {
  items: TagItem[];
};

export type HistoryPoint = {
  t: number;
  v: number;
  min: number;
  avg: number;
  max: number;
  count: number;
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
};

/** Выполняет типизированный GET-запрос к cloud-v3 и централизованно обрабатывает HTTP-ошибки. */
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

/** Запрашивает состояние cloud-v3 и подключенной базы данных. */
export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}

/** Возвращает список edge-установок, доступных в cloud-v3. */
export function getEdges(): Promise<EdgeResponse> {
  return request<EdgeResponse>('/edge');
}

/** Загружает справочник тегов, используя tag.name как отображаемое имя. */
export function getTags(params: { edge?: string; search?: string } = {}): Promise<TagResponse> {
  return request<TagResponse>('/tag', params);
}

/** Загружает текущие значения показателей для выбранного edge вместе с метаданными тегов. */
export function getCurrent(edge: string, tags?: string[]): Promise<CurrentResponse> {
  return request<CurrentResponse>('/current', {
    edge,
    tags: tags?.join(','),
  });
}

/** Формирует URL SSE-потока текущих значений для выбранного edge. */
export function getCurrentEventsUrl(edge: string, tags?: string[]): string {
  const url = new URL('/current/events', API_URL);
  url.searchParams.set('edge', edge);

  if (tags?.length) {
    url.searchParams.set('tags', tags.join(','));
  }

  return url.toString();
}

/** Запрашивает исторические ряды с avg-линией и min/max-диапазоном для графика. */
export function getHistory(params: {
  edge: string;
  tags?: string[];
  from?: string;
  to?: string;
  targetPoints?: number;
}): Promise<HistoryResponse> {
  return request<HistoryResponse>('/history', {
    edge: params.edge,
    tags: params.tags?.join(','),
    from: params.from,
    to: params.to,
    targetPoints: params.targetPoints,
  });
}
