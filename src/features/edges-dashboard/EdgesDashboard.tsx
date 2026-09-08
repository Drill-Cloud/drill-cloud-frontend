import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock3, Gauge, LogOut, RefreshCw, Search, Settings, ShieldAlert } from 'lucide-react';
import edgeImage from '../../assets/edge.png';
import { getEdges } from '../../entities/edge/api';
import { getEdgeDisplayName } from '../../entities/edge/model';
import type { EdgeItem } from '../../entities/edge/types';
import { useAuth } from '../../auth/authContext';

type EdgesDashboardProps = {
  onOpenEdge: (edgeId: string) => void;
  onOpenSettings: () => void;
};

function filterEdges(edges: EdgeItem[], search: string): EdgeItem[] {
  const query = search.trim().toLowerCase();
  return query ? edges.filter((edge) => `${edge.id} ${edge.name}`.toLowerCase().includes(query)) : edges;
}

/** Отображает список установок без расчетов по текущим значениям. */
export function EdgesDashboard({ onOpenEdge, onOpenSettings }: EdgesDashboardProps) {
  const [search, setSearch] = useState('');
  const auth = useAuth();
  const edges = useQuery({
    queryKey: ['edge'],
    queryFn: getEdges,
    refetchInterval: false,
  });

  const filteredEdges = useMemo(() => filterEdges(edges.data?.items ?? [], search), [edges.data?.items, search]);

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <span className="page-kicker">Drill Cloud v3</span>
          <h1>Установки</h1>
        </div>
        <div className="dashboard-actions">
          <label className="search-box dashboard-search">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск установки" />
          </label>
          <button type="button" className="icon-button" onClick={() => edges.refetch()} title="Обновить список">
            <RefreshCw size={18} />
          </button>
          <button type="button" className="ghost-button" onClick={onOpenSettings}>
            <Settings size={17} />
            Настройки
          </button>
          {auth.enabled ? (
            <button type="button" className="ghost-button" onClick={() => void auth.logout()}>
              <LogOut size={17} />
              Выйти
            </button>
          ) : null}
        </div>
      </header>

      <section className="dashboard-stats" aria-label="Статистика установок">
        <StatBlock label="Всего установок" value={edges.data?.items.length ?? 0} tone="neutral" />
        <StatBlock label="Найдено" value={filteredEdges.length} tone="accent" />
      </section>

      {edges.isError ? (
        <div className="empty-panel">Не удалось загрузить список установок: {String(edges.error)}</div>
      ) : (
        <section className="edge-card-grid" aria-label="Установки">
          {filteredEdges.map((edge) => (
            <EdgeCard
              key={edge.id}
              edge={edge}
              onOpenEdge={onOpenEdge}
            />
          ))}
        </section>
      )}

      {!edges.isPending && !filteredEdges.length && !edges.isError ? (
        <div className="empty-panel">В cloud-v3 пока нет установок</div>
      ) : null}
    </main>
  );
}

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

function EdgeCard({
  edge,
  onOpenEdge,
}: {
  edge: EdgeItem;
  onOpenEdge: (edgeId: string) => void;
}) {
  const title = getEdgeDisplayName(edge);

  return (
    <article className="edge-card" data-testid="edge-card" data-edge-id={edge.id}>
      <header className="edge-card__header">
        <div className="edge-card__logo">
          <img src={edgeImage} alt="" />
        </div>
        <div className="edge-card__title">
          <h2>{title}</h2>
          <span>{edge.id}</span>
        </div>
      </header>

      <div className="edge-card__actions" aria-label={`Разделы ${title}`}>
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
