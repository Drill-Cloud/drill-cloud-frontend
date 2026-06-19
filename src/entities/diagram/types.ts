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
