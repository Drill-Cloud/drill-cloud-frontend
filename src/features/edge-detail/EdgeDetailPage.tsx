import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import {
  countLiveCurrentItems,
  createCurrentTagLabels,
  filterCurrentItems,
  getLatestCurrentUpdatedAt,
} from '../current/model';
import { useCurrentEvents } from '../current/useCurrentEvents';
import { useCurrentQuery } from '../current/useCurrentQuery';
import { createRange } from '../history/dateRange';
import { useHistoryQuery } from '../history/useHistoryQuery';
import { ArchiveView } from './components/ArchiveView';
import { EdgeSidebar } from './components/EdgeSidebar';
import { EdgeTopbar } from './components/EdgeTopbar';
import { EquipmentView } from './components/EquipmentView';
import { IndicatorsView } from './components/IndicatorsView';
import { OverviewView } from './components/OverviewView';
import type { DetailView } from './types';

type EdgeDetailPageProps = {
  view: DetailView;
};

/** Собирает раздел выбранной буровой из вкладок текущих данных, архива и оборудования. */
export function EdgeDetailPage({ view }: EdgeDetailPageProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const { edgeId = '' } = useParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(() => createRange(24));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const edgePath = `/edges/${encodeURIComponent(edgeId)}`;
  const currentEventsConnected = useCurrentEvents(edgeId);
  const current = useCurrentQuery(edgeId, currentEventsConnected);
  const currentItems = useMemo(() => current.data?.items ?? [], [current.data?.items]);

  const tagLabels = useMemo(() => createCurrentTagLabels(currentItems), [currentItems]);
  const getTagLabel = (tag: string) => tagLabels[tag] ?? tag;
  const visibleItems = useMemo(() => filterCurrentItems(currentItems, search), [currentItems, search]);
  const latestUpdatedAt = useMemo(() => getLatestCurrentUpdatedAt(currentItems), [currentItems]);
  const liveCount = countLiveCurrentItems(currentItems);
  const { query: history, granularity: historyGranularity } = useHistoryQuery(edgeId, selectedTags[0], range);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? [] : [tag]));
  };

  const selectFirstTags = () => {
    setSelectedTags(visibleItems[0] ? [visibleItems[0].tag] : []);
  };

  const selectVisibleTags = () => {
    setSelectedTags(visibleItems[0] ? [visibleItems[0].tag] : []);
  };

  const clearVisibleTags = () => {
    const visibleTags = new Set(visibleItems.map((item) => item.tag));
    setSelectedTags((prev) => prev.filter((tag) => !visibleTags.has(tag)));
  };

  return (
    <main className={`app-shell ${sidebarCollapsed ? 'app-shell--sidebar-collapsed' : ''}`}>
      <EdgeSidebar
        collapsed={sidebarCollapsed}
        edgePath={edgePath}
        view={view}
        onNavigate={navigate}
        onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />

      <section className={`workspace workspace--${view}`}>
        <EdgeTopbar
          authEnabled={auth.enabled}
          currentEventsConnected={currentEventsConnected}
          edgeId={edgeId}
          onBack={() => navigate('/edges')}
          onLogout={() => void auth.logout()}
          onRefresh={() => void current.refetch()}
        />

        {view === 'overview' ? (
          <OverviewView
            edgeId={edgeId}
            totalTags={currentItems.length}
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
            historyGranulate={history.data?.granulate ?? historyGranularity.granulate}
            historyAxis={historyGranularity}
            range={range}
            onSearchChange={setSearch}
            onRangeChange={setRange}
            onToggleTag={toggleTag}
            onSelectFirstTags={selectFirstTags}
            onSelectVisibleTags={selectVisibleTags}
            onClearVisibleTags={clearVisibleTags}
            onClearTags={() => setSelectedTags([])}
            getTagLabel={getTagLabel}
            tagLabels={tagLabels}
          />
        ) : null}

        {view === 'indicators' ? (
          <IndicatorsView
            items={visibleItems}
            search={search}
            isError={current.isError}
            error={current.error}
            selectedTags={selectedTags}
            getTagLabel={getTagLabel}
            onSearchChange={setSearch}
            onToggleTag={toggleTag}
          />
        ) : null}

        {view === 'equipment' ? <EquipmentView /> : null}
      </section>
    </main>
  );
}
