import { lazy, Suspense, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Bell, Clock3, Gauge, LogOut, RefreshCw, Search, Settings, ShieldAlert } from 'lucide-react';
import { getCurrent } from '../../entities/current/api';
import { getEdges } from '../../entities/edge/api';
import { getEdgeDisplayName } from '../../entities/edge/model';
import type { EdgeItem } from '../../entities/edge/types';
import { useAuth } from '../../auth/authContext';
import { countLiveCurrentItems, getLatestCurrentUpdatedAt } from '../current/model';
import { formatDateTime } from '../../utils/format';
import type { TelemetryTone } from '../../shared/ui/telemetry/TelemetryScenes';

const TelemetryHeroScene = lazy(() => import('../../shared/ui/telemetry/TelemetryScenes').then((module) => ({
  default: module.TelemetryHeroScene,
})));
const TelemetryStatusScene = lazy(() => import('../../shared/ui/telemetry/TelemetryScenes').then((module) => ({
  default: module.TelemetryStatusScene,
})));

type EdgesDashboardProps = {
  onOpenEdge: (edgeId: string) => void;
  onOpenSettings: () => void;
};

function filterEdges(edges: EdgeItem[], search: string): EdgeItem[] {
  const query = search.trim().toLowerCase();
  return query ? edges.filter((edge) => `${edge.id} ${edge.name}`.toLowerCase().includes(query)) : edges;
}

/** Главная операторская страница: справочник установок и независимая краткая телеметрия по каждой карточке. */
export function EdgesDashboard({ onOpenEdge, onOpenSettings }: EdgesDashboardProps) {
  const [search, setSearch] = useState('');
  const auth = useAuth();
  const edges = useQuery({ queryKey: ['edge'], queryFn: getEdges, refetchInterval: false });
  const filteredEdges = useMemo(() => filterEdges(edges.data?.items ?? [], search), [edges.data?.items, search]);

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <a className="dashboard-brand" href="/edges" aria-label="Drill Cloud">
          <span><img src="/logo.png" alt="" /></span>
          <strong>DRILL <b>CLOUD</b></strong>
        </a>
        <div className="dashboard-actions">
          <label className="search-box dashboard-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти установку" /></label>
          <button type="button" className="icon-button" onClick={() => edges.refetch()} title="Обновить список"><RefreshCw size={18} /></button>
          <button type="button" className="icon-button" title="Уведомления"><Bell size={18} /></button>
          <button type="button" className="ghost-button" onClick={onOpenSettings}><Settings size={17} />Настройки</button>
          {auth.enabled ? <button type="button" className="ghost-button" onClick={() => void auth.logout()}><LogOut size={17} />Выйти</button> : null}
        </div>
      </header>

      <section className="dashboard-hero">
        <div className="dashboard-hero__copy"><span className="page-kicker">ОПЕРАЦИОННЫЙ ЦЕНТР</span><h1>Установки</h1><p>Единая картина состояния буровых — от доступности телеметрии до истории и видеопотоков.</p></div>
        <div className="dashboard-hero__scene" aria-hidden="true">
          <Suspense fallback={<div className="telemetry-scene-fallback" />}>
            <TelemetryHeroScene />
          </Suspense>
        </div>
        <div className="dashboard-hero__stats" aria-label="Статистика установок">
          <div><span>Всего установок</span><strong>{edges.data?.items.length ?? 0}</strong><small>в текущем контуре</small></div>
          <div><span>Найдено</span><strong>{filteredEdges.length}</strong><small>по выбранному фильтру</small></div>
        </div>
      </section>

      <section className="dashboard-toolbar"><div><span className="dashboard-toolbar__dot" />Данные установок загружены</div><button type="button" onClick={() => edges.refetch()}><RefreshCw size={15} />Обновить</button></section>

      {edges.isError ? <div className="empty-panel">Не удалось загрузить список установок: {String(edges.error)}</div> : (
        <section className="edge-card-grid" aria-label="Установки">{filteredEdges.map((edge) => <EdgeCard key={edge.id} edge={edge} onOpenEdge={onOpenEdge} />)}</section>
      )}
      {!edges.isPending && !filteredEdges.length && !edges.isError ? <div className="empty-panel">В cloud-v3 пока нет установок</div> : null}
    </main>
  );
}

function EdgeCard({ edge, onOpenEdge }: { edge: EdgeItem; onOpenEdge: (edgeId: string) => void }) {
  const title = getEdgeDisplayName(edge);
  const current = useQuery({ queryKey: ['current', edge.id], queryFn: () => getCurrent(edge.id), staleTime: 15_000, refetchInterval: 30_000 });
  const items = current.data?.items ?? [];
  const liveCount = countLiveCurrentItems(items);
  const availability = items.length ? Math.round((liveCount / items.length) * 1000) / 10 : null;
  const latestUpdatedAt = getLatestCurrentUpdatedAt(items);
  const tone: TelemetryTone = current.isError ? 'warning' : liveCount > 0 ? 'online' : 'neutral';
  const status = current.isError ? 'Требует внимания' : liveCount > 0 ? 'На связи' : current.isPending ? 'Подключение' : 'Нет Live-данных';
  const code = edge.id.replace(/[^a-z0-9]/gi, '').slice(-2).toUpperCase() || 'DC';

  return (
    <article className={`edge-card edge-card--${tone}`} data-testid="edge-card" data-edge-id={edge.id}>
      <header className="edge-card__header">
        <div className="edge-card__identity" data-tone={tone}><span>{code}</span><i /></div>
        <div className="edge-card__title"><span>{edge.id.toUpperCase()}</span><h2>{title}</h2></div>
        <span className={`edge-card__status edge-card__status--${tone}`}><i />{status}</span>
      </header>

      <div className="edge-card__telemetry">
        <div className="edge-card__availability"><span>Доступность данных</span><strong>{availability === null ? '—' : availability}<small>{availability === null ? '' : '%'}</small></strong><div><i style={{ width: `${availability ?? 0}%` }} /></div></div>
        <div className="edge-card__signal" aria-hidden="true">
          <Suspense fallback={<div className="telemetry-scene-fallback" />}>
            <TelemetryStatusScene tone={tone} />
          </Suspense>
          <span>{liveCount}<small>LIVE</small></span>
        </div>
      </div>

      <div className="edge-card__facts">
        <div><span>Показатели</span><strong>{items.length || '—'}</strong></div><div><span>Live</span><strong>{liveCount || '—'}</strong></div><div><span>Обновлено</span><strong>{latestUpdatedAt ? formatDateTime(latestUpdatedAt) : '—'}</strong></div>
      </div>

      <div className="edge-card__actions" aria-label={`Разделы ${title}`}><button type="button"><Gauge size={15} />Состояние байпасов</button><button type="button"><ShieldAlert size={15} />Аварии приводов</button><button type="button"><Clock3 size={15} />Техническое обслуживание</button></div>
      <section className="edge-card__maintenance" aria-label="Техническое обслуживание"><span>Техническое обслуживание</span><div><button type="button">Ежедневное</button><button type="button">Еженедельное</button><button type="button">Ежемесячное</button><button type="button">Полугодовое</button><button type="button">Годовое</button></div></section>
      <button type="button" className="edge-card__details" onClick={() => onOpenEdge(edge.id)}><span>Подробнее</span><ArrowRight size={18} /></button>
    </article>
  );
}
