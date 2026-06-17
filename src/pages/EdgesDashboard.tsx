import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock3, Gauge, LogOut, RefreshCw, Search, ShieldAlert, Wrench } from 'lucide-react';
import edgeImage from '../assets/edge.png';
import { EdgeItem, getEdges } from '../api/cloud';
import { useAuth } from '../auth/authContext';
import { formatDateTime } from '../utils/format';

type EdgesDashboardProps = {
  onOpenEdge: (edgeId: string) => void;
  onOpenEquipment: (edgeId: string) => void;
};

/** Определяет базовый статус edge по наличию последних и live-данных. */
function getEdgeState(edge: EdgeItem): 'ok' | 'warn' | 'empty' {
  if (!edge.lastDataAt) {
    return 'empty';
  }

  if (edge.liveTagCount > 0) {
    return 'ok';
  }

  return 'warn';
}

/** Возвращает пользовательское имя edge, если оно отличается от технического id. */
function getEdgeTitle(edge: EdgeItem): string {
  if (edge.name && edge.name !== edge.id) {
    return edge.name;
  }

  return edge.id;
}

/** Отображает стартовый dashboard со списком edge-установок и общей статистикой. */
export function EdgesDashboard({ onOpenEdge, onOpenEquipment }: EdgesDashboardProps) {
  const [search, setSearch] = useState('');
  const auth = useAuth();
  const edges = useQuery({
    queryKey: ['edge'],
    queryFn: getEdges,
    refetchInterval: 5_000,
  });

  const filteredEdges = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = edges.data?.items ?? [];

    if (!query) {
      return items;
    }

    return items.filter((edge) => `${edge.id} ${edge.name}`.toLowerCase().includes(query));
  }, [edges.data?.items, search]);

  const stats = {
    total: edges.data?.items.length ?? 0,
    normal: 0,
    emergency: 0,
    equipmentProblem: 0,
    maintenanceRequired: 0,
  };

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <span className="page-kicker">Drill Cloud</span>
          <h1>Буровые установки</h1>
        </div>
        <div className="dashboard-actions">
          <label className="search-box dashboard-search">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск буровой" />
          </label>
          <button type="button" className="icon-button" onClick={() => edges.refetch()} title="Обновить список">
            <RefreshCw size={18} />
          </button>
          {auth.enabled ? (
            <button type="button" className="ghost-button" onClick={() => void auth.logout()}>
              <LogOut size={17} />
              Разлогиниться
            </button>
          ) : null}
        </div>
      </header>

      <section className="dashboard-stats" aria-label="Статистика буровых">
        <StatBlock label="Всего установок" value={stats.total} tone="neutral" />
        <StatBlock label="В норме" value={stats.normal} tone="success" />
        <StatBlock label="Авария" value={stats.emergency} tone="danger" />
        <StatBlock label="Проблема оборудования" value={stats.equipmentProblem} tone="warning" />
        <StatBlock label="Требуется ТО" value={stats.maintenanceRequired} tone="accent" />
      </section>

      {edges.isError ? (
        <div className="empty-panel">Не удалось загрузить список буровых: {String(edges.error)}</div>
      ) : (
        <section className="edge-card-grid" aria-label="Буровые установки">
          {filteredEdges.map((edge, index) => (
            <EdgeCard key={edge.id} edge={edge} index={index} onOpenEdge={onOpenEdge} onOpenEquipment={onOpenEquipment} />
          ))}
        </section>
      )}

      {!edges.isPending && !filteredEdges.length && !edges.isError ? (
        <div className="empty-panel">В cloud-v2 пока нет буровых</div>
      ) : null}
    </main>
  );
}

/** Показывает один числовой показатель общей статистики dashboard. */
function StatBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'neutral' | 'success' | 'danger' | 'warning' | 'accent';
}) {
  return (
    <article className={`dashboard-stat dashboard-stat--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

/** Рендерит продуктовую карточку edge с быстрыми переходами в рабочие разделы. */
function EdgeCard({
  edge,
  onOpenEdge,
  onOpenEquipment,
}: {
  edge: EdgeItem;
  index: number;
  onOpenEdge: (edgeId: string) => void;
  onOpenEquipment: (edgeId: string) => void;
}) {
  const state = getEdgeState(edge);
  const title = getEdgeTitle(edge);
  const stateLabel = state === 'ok' ? 'В норме' : state === 'warn' ? 'Нет live' : 'Нет данных';

  return (
    <article className={`edge-card edge-card--${state}`}>
      <header className="edge-card__header">
        <div className="edge-card__logo">
          <img src={edgeImage} alt="" />
        </div>
        <div className="edge-card__title">
          <h2>{title}</h2>
          <span>{edge.id}</span>
        </div>
        <span className={`edge-state edge-state--${state}`}>
          <Gauge size={14} />
          {stateLabel}
        </span>
      </header>

      <dl className="edge-card__meta">
        <div>
          <dt>Показатели</dt>
          <dd>{edge.currentTagCount}/{edge.tagCount}</dd>
        </div>
        <div>
          <dt>Live</dt>
          <dd>{edge.liveTagCount}</dd>
        </div>
        <div>
          <dt>
            <Clock3 size={14} />
            Последние данные
          </dt>
          <dd>{edge.lastDataAt ? formatDateTime(edge.lastDataAt) : '—'}</dd>
        </div>
      </dl>

      <div className="edge-card__actions" aria-label={`Разделы ${title}`}>
        <button type="button" onClick={() => onOpenEquipment(edge.id)}>
          <Wrench size={15} />
          Оборудование
        </button>
        <button type="button">
          <Gauge size={15} />
          Состояние байпасов
        </button>
        <button type="button">
          <ShieldAlert size={15} />
          Аварии приводов
        </button>
        <button type="button">
          <Clock3 size={15} />
          Техническое обслуживание
        </button>
      </div>

      <section className="edge-card__maintenance" aria-label="Техническое обслуживание">
        <span>Техническое обслуживание</span>
        <div>
          <button type="button">Ежедневное</button>
          <button type="button">Еженедельное</button>
          <button type="button">Ежемесячное</button>
          <button type="button">Полугодовое</button>
          <button type="button">Годовое</button>
        </div>
      </section>

      <button type="button" className="edge-card__details" onClick={() => onOpenEdge(edge.id)}>
        <span>Подробнее</span>
        <ArrowRight size={18} />
      </button>
    </article>
  );
}
