import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CircuitBoard, DatabaseZap, PlugZap, RefreshCw } from 'lucide-react';
import type {
  CurrentEvent,
  CurrentItem,
  CurrentResponse,
} from '../api/cloud';
import { getCurrent, getCurrentEventsUrl } from '../api/cloud';
import {
  getPublishedDiagramPage,
  listDiagramPages,
  type DiagramDocument,
  type DiagramEdge,
  type DiagramNode,
  type DiagramPageSummary,
  type DiagramPoint,
} from '../api/diagram';
import { formatDateTime, formatNumber } from '../utils/format';

type ElectricalSchematicsPageProps = {
  edgeId: string;
};

type LiveValue = CurrentItem & {
  sourceKey: string;
};

type BindingTag = {
  tagId: string;
  edgeId: string;
  sourceKey: string;
  sseUrl?: string;
};

type LiveGroup = {
  sourceKey: string;
  edgeId: string;
  sseUrl?: string;
  tags: string[];
};

const DEFAULT_PAGE_PREFIXES = ['ELECTRICAL', 'MAIN', 'DIRECT'];

/** Выбирает опубликованную страницу, отдавая приоритет электросхеме текущей установки. */
function pickDefaultPage(pages: DiagramPageSummary[], edgeId: string): DiagramPageSummary | undefined {
  const published = pages.filter((page) => page.publishedRevision);
  const byPriority = [...published].sort((a, b) => {
    const aRank = getPageRank(a.pageKey, edgeId);
    const bRank = getPageRank(b.pageKey, edgeId);
    return aRank - bRank || a.pageKey.localeCompare(b.pageKey);
  });

  return byPriority[0];
}

/** Чем меньше ранг, тем выше страница в списке выбора опубликованных схем. */
function getPageRank(pageKey: string, edgeId: string): number {
  const exactKeys = DEFAULT_PAGE_PREFIXES.map((prefix) => (prefix === 'DIRECT' ? edgeId : `${prefix}_${edgeId}`));
  const exactIndex = exactKeys.indexOf(pageKey);
  if (exactIndex >= 0) {
    return exactIndex;
  }

  return pageKey.includes(edgeId) ? 10 : 20;
}

/** Собирает теги, которые надо читать по SSE, из виджетов и bindings у элементов схемы. */
function collectBindingTags(document: DiagramDocument): BindingTag[] {
  const tags: BindingTag[] = [];

  for (const node of document.nodes) {
    if (node.kind === 'tagWidget') {
      tags.push({
        tagId: node.tagId,
        edgeId: node.edgeId || document.ownerEdgeId,
        sourceKey: `edge:${node.edgeId || document.ownerEdgeId}`,
      });
      continue;
    }

    const bindings = node.bindings;
    if (!bindings) {
      continue;
    }

    const edgeId = bindings.sseEdgeId || bindings.edgeId || document.ownerEdgeId;
    const sourceKey = bindings.sseUrl || `edge:${edgeId}`;

    [bindings.stateTagId, bindings.alarmTagId].filter(Boolean).forEach((tagId) => {
      tags.push({
        tagId: tagId!,
        edgeId,
        sourceKey,
        sseUrl: bindings.sseUrl,
      });
    });
  }

  const unique = new Map<string, BindingTag>();
  tags.forEach((tag) => unique.set(`${tag.sourceKey}:${tag.edgeId}:${tag.tagId}`, tag));
  return Array.from(unique.values());
}

/** Группирует подписки так, чтобы один EventSource читал сразу несколько тегов одного edge/source. */
function createLiveGroups(tags: BindingTag[]): LiveGroup[] {
  const groups = new Map<string, LiveGroup>();

  tags.forEach((tag) => {
    const group = groups.get(tag.sourceKey) ?? {
      sourceKey: tag.sourceKey,
      edgeId: tag.edgeId,
      sseUrl: tag.sseUrl,
      tags: [],
    };

    if (!group.tags.includes(tag.tagId)) {
      group.tags.push(tag.tagId);
    }

    groups.set(tag.sourceKey, group);
  });

  return Array.from(groups.values());
}

/** Добавляет tags-параметр к пользовательскому SSE URL, если он еще не задан в настройке. */
function buildCustomSseUrl(sseUrl: string, tags: string[]): string {
  const url = new URL(sseUrl, window.location.origin);
  if (tags.length && !url.searchParams.has('tags')) {
    url.searchParams.set('tags', tags.join(','));
  }

  return url.toString();
}

/** Возвращает live-значение с учетом edge, но оставляет fallback по tag для старых схем. */
function getLiveValue(values: Map<string, LiveValue>, edgeId: string, tagId?: string): LiveValue | undefined {
  if (!tagId) {
    return undefined;
  }

  return values.get(`${edgeId}:${tagId}`) ?? values.get(`tag:${tagId}`);
}

/** Рассчитывает размеры полотна по опубликованным координатам элементов. */
function getCanvasBounds(document?: DiagramDocument) {
  const nodes = document?.nodes ?? [];
  const maxX = Math.max(...nodes.map((node) => node.position.x + getNodeSize(node).width), 960);
  const maxY = Math.max(...nodes.map((node) => node.position.y + getNodeSize(node).height), 560);

  return {
    width: Math.ceil(maxX + 80),
    height: Math.ceil(maxY + 80),
  };
}

function getNodeSize(node: DiagramNode) {
  if (node.kind === 'decoration') {
    return node.size;
  }

  return node.size ?? { width: 190, height: 82 };
}

function getNodeTitle(node: DiagramNode, value?: LiveValue) {
  if (node.kind === 'tagWidget') {
    return node.label || value?.name || node.tagId;
  }

  return String(node.data?.title || node.data?.text || node.decorationType);
}

function getNodeCenter(node: DiagramNode): DiagramPoint {
  const size = getNodeSize(node);
  return {
    x: node.position.x + size.width / 2,
    y: node.position.y + size.height / 2,
  };
}

function getEdgePoints(edge: DiagramEdge, nodeMap: Map<string, DiagramNode>): DiagramPoint[] {
  const source = nodeMap.get(edge.sourceNodeId);
  const target = nodeMap.get(edge.targetNodeId);
  if (!source || !target) {
    return [];
  }

  return [getNodeCenter(source), ...(edge.waypoints ?? []), getNodeCenter(target)];
}

function pointsToPolyline(points: DiagramPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

/** Отображает опубликованную электросхему и подставляет live-значения через SSE cloud-v3. */
export function ElectricalSchematicsPage({ edgeId }: ElectricalSchematicsPageProps) {
  const [selectedPageKey, setSelectedPageKey] = useState('');
  const [liveValues, setLiveValues] = useState(() => new Map<string, LiveValue>());
  const [connectedSources, setConnectedSources] = useState<Set<string>>(new Set());

  const pages = useQuery({
    queryKey: ['diagram-pages', edgeId],
    queryFn: () => listDiagramPages(edgeId),
    enabled: Boolean(edgeId),
  });

  const publishedPages = useMemo(() => pages.data?.filter((page) => page.publishedRevision) ?? [], [pages.data]);
  const selectedPage = useMemo(
    () => publishedPages.find((page) => page.pageKey === selectedPageKey) ?? pickDefaultPage(publishedPages, edgeId),
    [edgeId, publishedPages, selectedPageKey],
  );

  useEffect(() => {
    if (selectedPage && selectedPage.pageKey !== selectedPageKey) {
      setSelectedPageKey(selectedPage.pageKey);
    }
  }, [selectedPage, selectedPageKey]);

  const page = useQuery({
    queryKey: ['published-diagram-page', selectedPage?.pageKey],
    queryFn: () => getPublishedDiagramPage(selectedPage!.pageKey),
    enabled: Boolean(selectedPage?.pageKey),
  });

  const document = page.data?.document;
  const bindingTags = useMemo(() => (document ? collectBindingTags(document) : []), [document]);
  const liveGroups = useMemo(() => createLiveGroups(bindingTags), [bindingTags]);
  const nodeMap = useMemo(() => new Map((document?.nodes ?? []).map((node) => [node.id, node])), [document?.nodes]);
  const canvasBounds = useMemo(() => getCanvasBounds(document), [document]);

  useEffect(() => {
    setLiveValues(new Map());
    setConnectedSources(new Set());
  }, [selectedPage?.pageKey]);

  useEffect(() => {
    if (!liveGroups.length) {
      return undefined;
    }

    let closed = false;
    const eventSources: EventSource[] = [];

    const mergeResponse = (response: CurrentResponse, sourceKey: string) => {
      if (closed) {
        return;
      }

      setLiveValues((previous) => {
        const next = new Map(previous);
        response.items.forEach((item) => {
          const value = { ...item, sourceKey };
          next.set(`${item.edge}:${item.tag}`, value);
          next.set(`tag:${item.tag}`, value);
        });
        return next;
      });
    };

    liveGroups.forEach((group) => {
      if (!group.sseUrl) {
        void getCurrent(group.edgeId, group.tags).then((response) => mergeResponse(response, group.sourceKey));
      }

      const url = group.sseUrl ? buildCustomSseUrl(group.sseUrl, group.tags) : getCurrentEventsUrl(group.edgeId, group.tags);
      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setConnectedSources((previous) => new Set(previous).add(group.sourceKey));
      };

      eventSource.onerror = () => {
        setConnectedSources((previous) => {
          const next = new Set(previous);
          next.delete(group.sourceKey);
          return next;
        });
      };

      eventSource.onmessage = (message) => {
        const event = JSON.parse(message.data) as CurrentEvent;
        mergeResponse(event, group.sourceKey);
      };

      eventSources.push(eventSource);
    });

    return () => {
      closed = true;
      eventSources.forEach((eventSource) => eventSource.close());
    };
  }, [liveGroups]);

  const liveTagCount = liveValues.size ? Array.from(liveValues.keys()).filter((key) => key.startsWith('tag:')).length : 0;
  const connected = connectedSources.size > 0;

  return (
    <section className="electrical-section">
      <div className="section-header">
        <div>
          <span className="page-kicker">
            <CircuitBoard size={14} />
            Электросхемы
          </span>
          <h2>{page.data?.title || document?.title || selectedPage?.pageKey || edgeId}</h2>
        </div>
        <div className="electrical-toolbar">
          {publishedPages.length > 1 ? (
            <label>
              Схема
              <select value={selectedPageKey} onChange={(event) => setSelectedPageKey(event.target.value)}>
                {publishedPages.map((item) => (
                  <option key={item.pageKey} value={item.pageKey}>
                    {item.title || item.pageKey}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className={`source-chip electrical-live-chip ${connected ? 'electrical-live-chip--sse' : ''}`}>
            <DatabaseZap size={16} />
            {connected ? `SSE · ${connectedSources.size}` : liveGroups.length ? 'подключение SSE' : 'нет привязок'}
          </div>
          <button type="button" className="icon-button" onClick={() => void page.refetch()} title="Обновить схему">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {pages.isError ? (
        <div className="empty-panel">Не удалось загрузить список опубликованных схем: {String(pages.error)}</div>
      ) : null}

      {!pages.isPending && !publishedPages.length && !pages.isError ? (
        <div className="empty-panel">Для {edgeId} пока нет опубликованных схем</div>
      ) : null}

      {page.isError ? (
        <div className="empty-panel">Не удалось загрузить опубликованную схему: {String(page.error)}</div>
      ) : null}

      {document ? (
        <div className="electrical-layout">
          <div className="electrical-canvas-shell">
            <div
              className="electrical-canvas"
              style={{ width: canvasBounds.width, height: canvasBounds.height }}
            >
              {document.background?.url ? (
                <img
                  className={`electrical-background electrical-background--${document.background.fit ?? 'contain'}`}
                  src={document.background.url}
                  alt=""
                  style={{ opacity: document.background.opacity ?? 0.22 }}
                />
              ) : null}

              <svg className="electrical-wires" width={canvasBounds.width} height={canvasBounds.height}>
                {(document.edges ?? []).map((edge) => {
                  const points = getEdgePoints(edge, nodeMap);
                  if (points.length < 2) {
                    return null;
                  }

                  return (
                    <polyline
                      key={edge.id}
                      className={`electrical-wire electrical-wire--${edge.kind} ${edge.animated ? 'electrical-wire--animated' : ''}`}
                      points={pointsToPolyline(points)}
                    />
                  );
                })}
              </svg>

              {document.nodes.map((node) => (
                <ElectricalNode
                  key={node.id}
                  node={node}
                  ownerEdgeId={document.ownerEdgeId}
                  liveValues={liveValues}
                />
              ))}
            </div>
          </div>

          <aside className="electrical-side-panel">
            <div>
              <span>Опубликовано</span>
              <strong>{page.data?.publishedAt ? formatDateTime(page.data.publishedAt) : '-'}</strong>
            </div>
            <div>
              <span>Элементы</span>
              <strong>{document.nodes.length}</strong>
            </div>
            <div>
              <span>Провода</span>
              <strong>{document.edges.length}</strong>
            </div>
            <div>
              <span>Live-теги</span>
              <strong>{liveTagCount}</strong>
            </div>
          </aside>
        </div>
      ) : page.isPending || pages.isPending ? (
        <div className="empty-panel">Загрузка опубликованной схемы...</div>
      ) : null}
    </section>
  );
}

function ElectricalNode({
  node,
  ownerEdgeId,
  liveValues,
}: {
  node: DiagramNode;
  ownerEdgeId: string;
  liveValues: Map<string, LiveValue>;
}) {
  const size = getNodeSize(node);
  const bindings = node.kind === 'decoration' ? node.bindings : undefined;
  const bindingEdgeId = bindings?.sseEdgeId || bindings?.edgeId || ownerEdgeId;
  const mainValue =
    node.kind === 'tagWidget'
      ? getLiveValue(liveValues, node.edgeId || ownerEdgeId, node.tagId)
      : getLiveValue(liveValues, bindingEdgeId, bindings?.stateTagId);
  const alarmValue = node.kind === 'decoration' ? getLiveValue(liveValues, bindingEdgeId, bindings?.alarmTagId) : undefined;
  const alarmActive = Boolean(alarmValue && Number(alarmValue.value) !== 0);
  const stateActive = Boolean(mainValue && Number(mainValue.value) !== 0);
  const title = getNodeTitle(node, mainValue);
  const style: CSSProperties = {
    left: node.position.x,
    top: node.position.y,
    width: size.width,
    height: size.height,
    zIndex: node.zIndex ?? 1,
    transform: node.kind === 'decoration' && node.rotation ? `rotate(${node.rotation}deg)` : undefined,
  };

  return (
    <article
      className={[
        'electrical-node',
        `electrical-node--${node.kind}`,
        node.kind === 'decoration' ? `electrical-node--${node.decorationType}` : `electrical-node--${node.widgetType}`,
        stateActive ? 'electrical-node--active' : '',
        alarmActive ? 'electrical-node--alarm' : '',
      ].join(' ')}
      style={style}
      title={title}
    >
      <div className="electrical-node__header">
        {alarmActive ? <AlertTriangle size={15} /> : node.kind === 'tagWidget' ? <Activity size={15} /> : <PlugZap size={15} />}
        <span>{title}</span>
      </div>

      {mainValue ? (
        <strong className="electrical-node__value">
          {formatNumber(mainValue.value)}
          {mainValue.unitOfMeasurement ? <small>{mainValue.unitOfMeasurement}</small> : null}
        </strong>
      ) : node.kind === 'decoration' ? (
        <span className="electrical-node__text">{String(node.data?.text || node.data?.title || node.decorationType)}</span>
      ) : (
        <strong className="electrical-node__value">-</strong>
      )}

      <div className="electrical-node__footer">
        {node.kind === 'tagWidget' ? <span>{node.tagId}</span> : bindings?.stateTagId ? <span>{bindings.stateTagId}</span> : <span>{node.decorationType}</span>}
        {alarmValue ? <span className="electrical-node__alarm">alarm {formatNumber(alarmValue.value)}</span> : null}
      </div>
    </article>
  );
}
