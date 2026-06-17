import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  CalendarClock,
  ChevronDown,
  DatabaseZap,
  Gauge,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Wrench,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { CurrentEvent, CurrentItem, CurrentResponse, getCurrent, getCurrentEventsUrl, getHistory } from '../api/cloud';
import { useAuth } from '../auth/authContext';
import { HistoryChart } from '../components/HistoryChart';
import { MetricCard } from '../components/MetricCard';
import { ToirLightIframe } from '../components/ToirLightIframe';
import { formatDateTime, formatNumber, toInputDateTimeValue, toIsoFromInput } from '../utils/format';
import { getMetricStatus } from '../utils/metricStatus';

const RANGE_PRESETS = [
  { id: '1h', label: '1 час', hours: 1 },
  { id: '6h', label: '6 часов', hours: 6 },
  { id: '24h', label: '24 часа', hours: 24 },
  { id: '7d', label: '7 дней', hours: 24 * 7 },
  { id: '30d', label: '30 дней', hours: 24 * 30 },
] as const;

const ACTIVE_EQUIPMENT_PATH =
  '/equipment?filter=%7B%22status%22%3A%5B%22Active%22%5D%7D&displayedFilters=%7B%22status%22%3Atrue%7D';

type DetailView = 'overview' | 'archive' | 'indicators' | 'equipment';

type EdgeDetailPageProps = {
  view: DetailView;
};

/** Создает диапазон истории от текущего времени на заданное количество часов назад. */
function createRange(hours: number) {
  const to = new Date();
  const from = new Date(to.getTime() - hours * 60 * 60 * 1000);
  return {
    from: toInputDateTimeValue(from),
    to: toInputDateTimeValue(to),
  };
}

/** Собирает общий layout edge-раздела: меню, live-данные, архив, показатели и iframe оборудования. */
export function EdgeDetailPage({ view }: EdgeDetailPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const { edgeId = '' } = useParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentEventsConnected, setCurrentEventsConnected] = useState(false);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(() => createRange(24));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [valueMode, setValueMode] = useState<'avg' | 'last' | 'min' | 'max'>('avg');

  const edgePath = `/edges/${encodeURIComponent(edgeId)}`;

  const current = useQuery({
    queryKey: ['current', edgeId],
    queryFn: () => getCurrent(edgeId),
    enabled: Boolean(edgeId),
    refetchInterval: currentEventsConnected ? false : 1_000,
  });

  useEffect(() => {
    if (!edgeId || typeof EventSource === 'undefined') {
      setCurrentEventsConnected(false);
      return undefined;
    }

    const eventSource = new EventSource(getCurrentEventsUrl(edgeId));

    eventSource.onopen = () => setCurrentEventsConnected(true);
    eventSource.onerror = () => setCurrentEventsConnected(false);
    eventSource.onmessage = (message) => {
      const event = JSON.parse(message.data) as CurrentEvent;

      queryClient.setQueryData<CurrentResponse>(['current', edgeId], (previous) => {
        const byTag = new Map((previous?.items ?? []).map((item) => [item.tag, item]));
        event.items.forEach((item) => byTag.set(item.tag, item));

        return {
          edge: event.edge,
          items: Array.from(byTag.values()).sort((left, right) => left.tag.localeCompare(right.tag)),
        };
      });
    };

    return () => {
      eventSource.close();
      setCurrentEventsConnected(false);
    };
  }, [edgeId, queryClient]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = current.data?.items ?? [];
    return query ? items.filter((item) => item.tag.toLowerCase().includes(query)) : items;
  }, [current.data?.items, search]);

  const latestUpdatedAt = useMemo(() => {
    const latest = (current.data?.items ?? []).reduce<number | null>((max, item) => {
      const updatedAt = new Date(item.updatedAt).getTime();
      return Number.isFinite(updatedAt) && (max === null || updatedAt > max) ? updatedAt : max;
    }, null);

    return latest === null ? undefined : new Date(latest);
  }, [current.data?.items]);

  const liveCount = current.data?.items.filter((item) => {
    const ageSeconds = (Date.now() - new Date(item.time).getTime()) / 1000;
    return ageSeconds <= 30;
  }).length ?? 0;

  const history = useQuery({
    queryKey: ['history', edgeId, selectedTags, range.from, range.to, valueMode],
    queryFn: () =>
      getHistory({
        edge: edgeId,
        tags: selectedTags,
        from: toIsoFromInput(range.from),
        to: toIsoFromInput(range.to),
        targetPoints: 1600,
        valueMode,
      }),
    enabled: Boolean(edgeId && selectedTags.length),
    refetchInterval: 5_000,
  });

  /** Переключает выбранный тег для отображения на историческом графике. */
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  /** Быстро выбирает первые найденные показатели для первичного анализа графика. */
  const selectFirstTags = () => {
    setSelectedTags(visibleItems.slice(0, 6).map((item) => item.tag));
  };

  /** Добавляет все отфильтрованные показатели к текущему набору выбранных тегов. */
  const selectVisibleTags = () => {
    setSelectedTags((prev) => Array.from(new Set([...prev, ...visibleItems.map((item) => item.tag)])));
  };

  /** Снимает выбор только с тех тегов, которые сейчас видны после фильтра поиска. */
  const clearVisibleTags = () => {
    const visibleTags = new Set(visibleItems.map((item) => item.tag));
    setSelectedTags((prev) => prev.filter((tag) => !visibleTags.has(tag)));
  };

  return (
    <main className={`app-shell ${sidebarCollapsed ? 'app-shell--sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.png" alt="" />
          <div className="brand__text">
            <strong>Drill UI</strong>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            title={sidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="nav-list" aria-label="Основная навигация">
          <button className="nav-item nav-item--button" type="button" onClick={() => navigate('/edges')}>
            <Menu size={18} />
            <span className="nav-label">Буровые</span>
          </button>
          <button
            className={`nav-item nav-item--button ${view === 'overview' ? 'nav-item--active' : ''}`}
            type="button"
            onClick={() => navigate(edgePath)}
          >
            <Gauge size={18} />
            <span className="nav-label">Обзор</span>
          </button>
          <button
            className={`nav-item nav-item--button ${view === 'archive' ? 'nav-item--active' : ''}`}
            type="button"
            onClick={() => navigate(`${edgePath}/archive`)}
          >
            <BarChart3 size={18} />
            <span className="nav-label">Архив</span>
          </button>
          <button
            className={`nav-item nav-item--button ${view === 'indicators' ? 'nav-item--active' : ''}`}
            type="button"
            onClick={() => navigate(`${edgePath}/indicators`)}
          >
            <Activity size={18} />
            <span className="nav-label">Показатели</span>
          </button>
          <button
            className={`nav-item nav-item--button ${view === 'equipment' ? 'nav-item--active' : ''}`}
            type="button"
            onClick={() => navigate(`${edgePath}/equipment`)}
          >
            <Wrench size={18} />
            <span className="nav-label">Оборудование</span>
          </button>
        </nav>
      </aside>

      <section className={`workspace workspace--${view}`}>
        <header className="topbar">
          <div>
            <span className="page-kicker">Операторская панель</span>
            <h1>Буровая установка {edgeId}</h1>
          </div>
          <div className="topbar-actions">
            <button type="button" className="ghost-button" onClick={() => navigate('/edges')}>
              <Menu size={17} />
              К списку
            </button>
            <button type="button" className="icon-button" onClick={() => current.refetch()} title="Обновить данные">
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

        {view === 'overview' ? (
          <OverviewView
            edgeId={edgeId}
            totalTags={current.data?.items.length ?? 0}
            liveCount={liveCount}
            latestUpdatedAt={latestUpdatedAt}
            selectedCount={selectedTags.length}
            onOpenArchive={() => navigate(`${edgePath}/archive`)}
            onOpenIndicators={() => navigate(`${edgePath}/indicators`)}
            onOpenEquipment={() => navigate(`${edgePath}/equipment`)}
          />
        ) : null}

        {view === 'archive' ? (
          <ArchiveView
            items={visibleItems}
            search={search}
            selectedTags={selectedTags}
            history={history.data}
            historyLoading={history.isPending && selectedTags.length > 0}
            historySource={history.data?.source}
            resolutionSeconds={history.data?.resolutionSeconds}
            range={range}
            valueMode={valueMode}
            onSearchChange={setSearch}
            onRangeChange={setRange}
            onValueModeChange={setValueMode}
            onToggleTag={toggleTag}
            onSelectFirstTags={selectFirstTags}
            onSelectVisibleTags={selectVisibleTags}
            onClearVisibleTags={clearVisibleTags}
            onClearTags={() => setSelectedTags([])}
          />
        ) : null}

        {view === 'indicators' ? (
          <IndicatorsView
            items={visibleItems}
            search={search}
            isError={current.isError}
            error={current.error}
            selectedTags={selectedTags}
            onSearchChange={setSearch}
            onToggleTag={toggleTag}
          />
        ) : null}

        {view === 'equipment' ? <EquipmentView /> : null}
      </section>
    </main>
  );
}

/** Показывает обзор выбранного edge и быстрые переходы в основные разделы. */
function OverviewView({
  edgeId,
  totalTags,
  liveCount,
  latestUpdatedAt,
  selectedCount,
  onOpenArchive,
  onOpenIndicators,
  onOpenEquipment,
}: {
  edgeId: string;
  totalTags: number;
  liveCount: number;
  latestUpdatedAt?: Date;
  selectedCount: number;
  onOpenArchive: () => void;
  onOpenIndicators: () => void;
  onOpenEquipment: () => void;
}) {
  return (
    <section className="detail-overview">
      <div className="summary-grid">
        <div className="summary-card">
          <span>Всего показателей</span>
          <strong>{totalTags}</strong>
        </div>
        <div className="summary-card">
          <span>Live</span>
          <strong>{liveCount}</strong>
        </div>
        <div className="summary-card">
          <span>Выбрано для графика</span>
          <strong>{selectedCount}</strong>
        </div>
        <div className="summary-card">
          <span>Последнее обновление</span>
          <strong>{latestUpdatedAt ? formatDateTime(latestUpdatedAt) : '—'}</strong>
        </div>
      </div>

      <section className="detail-action-panel">
        <div>
          <span className="page-kicker">Разделы</span>
          <h2>{edgeId}</h2>
        </div>
        <div className="detail-action-grid">
          <button type="button" onClick={onOpenIndicators}>
            <Activity size={18} />
            Текущие показатели
          </button>
          <button type="button" onClick={onOpenArchive}>
            <BarChart3 size={18} />
            Архив и график
          </button>
          <button type="button" onClick={onOpenEquipment}>
            <Wrench size={18} />
            Состояние оборудования
          </button>
          <button type="button">
            <CalendarClock size={18} />
            Техническое обслуживание
          </button>
        </div>
      </section>
    </section>
  );
}

/** Управляет выбором тегов, диапазона и режима агрегации для исторического графика. */
function ArchiveView({
  items,
  search,
  selectedTags,
  history,
  historyLoading,
  historySource,
  resolutionSeconds,
  range,
  valueMode,
  onSearchChange,
  onRangeChange,
  onValueModeChange,
  onToggleTag,
  onSelectFirstTags,
  onSelectVisibleTags,
  onClearVisibleTags,
  onClearTags,
}: {
  items: Array<{ tag: string; value: number; time: string }>;
  search: string;
  selectedTags: string[];
  history: Parameters<typeof HistoryChart>[0]['data'];
  historyLoading: boolean;
  historySource?: string;
  resolutionSeconds?: number | null;
  range: { from: string; to: string };
  valueMode: 'avg' | 'last' | 'min' | 'max';
  onSearchChange: (value: string) => void;
  onRangeChange: (value: { from: string; to: string }) => void;
  onValueModeChange: (value: 'avg' | 'last' | 'min' | 'max') => void;
  onToggleTag: (tag: string) => void;
  onSelectFirstTags: () => void;
  onSelectVisibleTags: () => void;
  onClearVisibleTags: () => void;
  onClearTags: () => void;
}) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const selectedPreview = selectedTags.slice(0, 10);
  const hiddenSelectedCount = Math.max(0, selectedTags.length - selectedPreview.length);

  return (
    <section className="chart-section chart-section--archive">
      <div className="section-header">
        <div>
          <span className="page-kicker">
            <CalendarClock size={14} />
            История
          </span>
          <h2>График параметров</h2>
        </div>
        <div className="source-chip">
          <DatabaseZap size={16} />
          {historySource ?? 'source'}
          {resolutionSeconds ? ` · ${resolutionSeconds}s` : ''}
        </div>
      </div>

      <div className="archive-tag-panel">
        <button
          type="button"
          className="archive-tag-panel__toggle"
          onClick={() => setSelectorOpen((open) => !open)}
          aria-expanded={selectorOpen}
        >
          <span>
            Показатели
            <strong>{selectedTags.length} выбрано · {items.length} найдено</strong>
          </span>
          <ChevronDown size={18} />
        </button>

        {selectorOpen ? (
          <div className="tag-selector">
            <div className="tag-selector__header">
              <label className="search-box">
                <Search size={16} />
                <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Поиск" />
              </label>
              <div className="tag-selector__tools">
                <button type="button" onClick={onSelectFirstTags}>
                  Первые 6
                </button>
                <button type="button" onClick={onSelectVisibleTags}>
                  Выбрать найденные
                </button>
                <button type="button" onClick={onClearVisibleTags}>
                  Снять найденные
                </button>
                <button type="button" onClick={onClearTags}>
                  Сбросить все
                </button>
              </div>
            </div>

            <div className="selected-tags">
              {selectedPreview.length ? selectedPreview.map((tag) => <span key={tag}>{tag}</span>) : <span>Не выбрано</span>}
              {hiddenSelectedCount > 0 ? <span>+{hiddenSelectedCount}</span> : null}
            </div>

            <div className="tag-select-list">
              {items.map((item) => {
                const selected = selectedTags.includes(item.tag);
                return (
                  <button
                    key={item.tag}
                    type="button"
                    className={`tag-select-item ${selected ? 'tag-select-item--selected' : ''}`}
                    onClick={() => onToggleTag(item.tag)}
                  >
                    <span>{item.tag}</span>
                    <strong>{item.value.toLocaleString('ru-RU', { maximumFractionDigits: 3 })}</strong>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="archive-chart">
        <div className="toolbar">
          <div className="segmented">
            {RANGE_PRESETS.map((preset) => (
              <button key={preset.id} type="button" onClick={() => onRangeChange(createRange(preset.hours))}>
                {preset.label}
              </button>
            ))}
          </div>
          <label>
            С
            <input
              type="datetime-local"
              value={range.from}
              onChange={(event) => onRangeChange({ ...range, from: event.target.value })}
            />
          </label>
          <label>
            По
            <input
              type="datetime-local"
              value={range.to}
              onChange={(event) => onRangeChange({ ...range, to: event.target.value })}
            />
          </label>
          <label>
            Режим
            <select value={valueMode} onChange={(event) => onValueModeChange(event.target.value as typeof valueMode)}>
              <option value="avg">avg</option>
              <option value="last">last</option>
              <option value="min">min</option>
              <option value="max">max</option>
            </select>
          </label>
        </div>

        {selectedTags.length ? (
          <HistoryChart
            data={history}
            loading={historyLoading}
            from={toIsoFromInput(range.from)}
            to={toIsoFromInput(range.to)}
          />
        ) : (
          <div className="chart-placeholder">Разверните список показателей и выберите серии для графика</div>
        )}
      </div>
    </section>
  );
}

/** Встраивает страницу активного оборудования из TOиР light почти на всю рабочую область. */
function EquipmentView() {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <section className="equipment-section" aria-label="Активное оборудование">
      <div className="equipment-frame-shell" aria-busy={!iframeLoaded}>
        {!iframeLoaded ? (
          <div className="equipment-frame-loading" role="status" aria-live="polite">
            <span className="equipment-frame-loading__ring" aria-hidden />
            <span>Загрузка интерфейса управления оборудованием...</span>
          </div>
        ) : null}

        <ToirLightIframe
          className="equipment-frame"
          path={ACTIVE_EQUIPMENT_PATH}
          title="ТОиР light: управление активным оборудованием"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </section>
  );
}

/** Показывает текущие показатели edge в режимах общей картины и детальных карточек. */
function IndicatorsView({
  items,
  search,
  isError,
  error,
  selectedTags,
  onSearchChange,
  onToggleTag,
}: {
  items: CurrentItem[];
  search: string;
  isError: boolean;
  error: unknown;
  selectedTags: string[];
  onSearchChange: (value: string) => void;
  onToggleTag: (tag: string) => void;
}) {
  const [displayMode, setDisplayMode] = useState<'overview' | 'cards'>('overview');
  const itemStatuses = useMemo(() => {
    const now = Date.now();
    return items.map((item) => ({ item, statusInfo: getMetricStatus(item, now) }));
  }, [items]);
  const statusCounts = itemStatuses.reduce(
    (counts, { statusInfo }) => {
      counts[statusInfo.status] += 1;
      return counts;
    },
    { normal: 0, warning: 0, critical: 0 },
  );

  return (
    <section className="tags-section">
      <div className="section-header">
        <div>
          <span className="page-kicker">
            <Search size={14} />
            Показатели
          </span>
          <h2>Текущие значения</h2>
        </div>
        <div className="indicator-controls">
          <div className="view-switch" aria-label="Режим отображения показателей">
            <button
              type="button"
              className={displayMode === 'overview' ? 'view-switch__button--active' : ''}
              onClick={() => setDisplayMode('overview')}
            >
              Картина
            </button>
            <button
              type="button"
              className={displayMode === 'cards' ? 'view-switch__button--active' : ''}
              onClick={() => setDisplayMode('cards')}
            >
              Карточки
            </button>
          </div>
          <label className="search-box">
            <Search size={16} />
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Поиск показателя" />
          </label>
        </div>
      </div>

      <div className="indicator-summary">
        <div>
          <span>Всего</span>
          <strong>{items.length}</strong>
        </div>
        <div>
          <span>В норме</span>
          <strong>{statusCounts.normal}</strong>
        </div>
        <div>
          <span>Предупреждение</span>
          <strong>{statusCounts.warning}</strong>
        </div>
        <div>
          <span>Критично</span>
          <strong>{statusCounts.critical}</strong>
        </div>
        <div>
          <span>На графике</span>
          <strong>{selectedTags.length}</strong>
        </div>
      </div>

      {isError ? (
        <div className="empty-panel">Не удалось загрузить текущие значения: {String(error)}</div>
      ) : displayMode === 'overview' ? (
        <div className="metric-mosaic">
          {itemStatuses.map(({ item, statusInfo }) => (
            <button
              key={`${item.edge}:${item.tag}`}
              type="button"
              className={`metric-tile metric-tile--${statusInfo.status} ${selectedTags.includes(item.tag) ? 'metric-tile--selected' : ''}`}
              title={`${item.tag}: ${formatNumber(item.value)} · ${statusInfo.label}`}
              onClick={() => onToggleTag(item.tag)}
            >
              <span className="metric-tile__status" />
              <span className="metric-tile__tag">{item.tag}</span>
              <strong>{formatNumber(item.value)}</strong>
            </button>
          ))}
        </div>
      ) : (
        <div className="metric-grid">
          {itemStatuses.map(({ item, statusInfo }) => (
            <MetricCard
              key={`${item.edge}:${item.tag}`}
              item={item}
              statusInfo={statusInfo}
              selected={selectedTags.includes(item.tag)}
              onToggle={onToggleTag}
            />
          ))}
        </div>
      )}
    </section>
  );
}
