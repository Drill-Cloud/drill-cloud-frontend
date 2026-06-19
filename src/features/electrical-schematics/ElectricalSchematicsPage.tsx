import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircuitBoard, DatabaseZap, RefreshCw } from 'lucide-react';
import { getPublishedDiagramPage, listDiagramPages } from '../../entities/diagram/api';
import { formatDateTime } from '../../utils/format';
import { ElectricalNode } from './ElectricalNode';
import { getCanvasBounds, getEdgePoints, pointsToPolyline } from './geometry';
import { collectBindingTags, createLiveGroups, pickDefaultPage } from './model';
import { useElectricalLiveValues } from './useElectricalLiveValues';

type ElectricalSchematicsPageProps = {
  edgeId: string;
};

/** Отображает опубликованную электросхему и подставляет live-значения через SSE cloud-v3. */
export function ElectricalSchematicsPage({ edgeId }: ElectricalSchematicsPageProps) {
  const [selectedPageKey, setSelectedPageKey] = useState('');

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

  const diagramDocument = page.data?.document;
  const bindingTags = useMemo(() => (diagramDocument ? collectBindingTags(diagramDocument) : []), [diagramDocument]);
  const liveGroups = useMemo(() => createLiveGroups(bindingTags), [bindingTags]);
  const nodeMap = useMemo(() => new Map((diagramDocument?.nodes ?? []).map((node) => [node.id, node])), [diagramDocument?.nodes]);
  const canvasBounds = useMemo(() => getCanvasBounds(diagramDocument), [diagramDocument]);
  const { connectedSources, liveValues } = useElectricalLiveValues(liveGroups, selectedPage?.pageKey);
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
          <h2>{page.data?.title || diagramDocument?.title || selectedPage?.pageKey || edgeId}</h2>
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

      {diagramDocument ? (
        <div className="electrical-layout">
          <div className="electrical-canvas-shell">
            <div className="electrical-canvas" style={{ width: canvasBounds.width, height: canvasBounds.height }}>
              {diagramDocument.background?.url ? (
                <img
                  className={`electrical-background electrical-background--${diagramDocument.background.fit ?? 'contain'}`}
                  src={diagramDocument.background.url}
                  alt=""
                  style={{ opacity: diagramDocument.background.opacity ?? 0.22 }}
                />
              ) : null}

              <svg className="electrical-wires" width={canvasBounds.width} height={canvasBounds.height}>
                {(diagramDocument.edges ?? []).map((edge) => {
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

              {diagramDocument.nodes.map((node) => (
                <ElectricalNode
                  key={node.id}
                  node={node}
                  ownerEdgeId={diagramDocument.ownerEdgeId}
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
              <strong>{diagramDocument.nodes.length}</strong>
            </div>
            <div>
              <span>Провода</span>
              <strong>{diagramDocument.edges.length}</strong>
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
