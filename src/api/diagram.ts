import { getAccessToken } from '../auth/keycloak';

const DIAGRAM_API_URL = import.meta.env.VITE_DIAGRAM_API_URL ?? 'http://localhost:3002';

export type DiagramPoint = {
  x: number;
  y: number;
};

export type DiagramSize = {
  width: number;
  height: number;
};

export type DiagramBindingConfig = {
  stateTagId?: string;
  alarmTagId?: string;
  edgeId?: string;
  sseEdgeId?: string;
  sseUrl?: string;
};

export type DiagramNode =
  | {
      id: string;
      kind: 'tagWidget';
      tagId: string;
      edgeId: string;
      widgetType: string;
      position: DiagramPoint;
      size?: DiagramSize;
      zIndex?: number;
      label?: string;
      displayType?: 'widget' | 'compact' | 'card';
      style?: Record<string, unknown>;
    }
  | {
      id: string;
      kind: 'decoration';
      decorationType: string;
      position: DiagramPoint;
      size: DiagramSize;
      rotation?: number;
      zIndex?: number;
      data?: Record<string, unknown>;
      style?: Record<string, unknown>;
      bindings?: DiagramBindingConfig;
    };

export type DiagramEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceSide?: 'left' | 'right' | 'top' | 'bottom';
  targetSide?: 'left' | 'right' | 'top' | 'bottom';
  kind: 'wire' | 'power' | 'signal' | 'alert';
  label?: string;
  animated?: boolean;
  waypoints?: DiagramPoint[];
};

export type DiagramDocument = {
  schemaVersion: number;
  pageKey: string;
  ownerEdgeId: string;
  title?: string;
  viewport?: { x: number; y: number; zoom: number } | null;
  background?: {
    url?: string;
    opacity?: number;
    fit?: 'contain' | 'cover' | 'stretch';
  };
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

export type DiagramPageSummary = {
  pageKey: string;
  ownerEdgeId: string;
  title?: string | null;
  schemaVersion: number;
  revision: number;
  status: 'draft' | 'published' | 'archived';
  publishedRevision?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DiagramPageResponse = DiagramPageSummary & {
  document: DiagramDocument;
};

/** Выполняет запрос к diagram-service и пробрасывает Bearer-токен, если UI работает с SSO. */
async function request<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(path, DIAGRAM_API_URL);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const token = await getAccessToken();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/** Возвращает список страниц схем, опубликованность определяется по publishedRevision. */
export function listDiagramPages(ownerEdgeId?: string): Promise<DiagramPageSummary[]> {
  return request<DiagramPageSummary[]>('/diagram/pages', { ownerEdgeId });
}

/** Загружает опубликованную версию страницы схемы. */
export function getPublishedDiagramPage(pageKey: string): Promise<DiagramPageResponse> {
  return request<DiagramPageResponse>(`/diagram/pages/${encodeURIComponent(pageKey)}/published`);
}
