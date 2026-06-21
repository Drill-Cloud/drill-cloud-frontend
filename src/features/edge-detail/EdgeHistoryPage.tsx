import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getCurrent } from '../../entities/current/api';
import { getHistory } from '../../entities/history/api';
import { toIsoFromInput } from '../../utils/format';
import { getHistoryGranularity } from '../../utils/historyGranularity';
import { createCurrentTagLabels, filterCurrentItems } from '../current/model';
import { useCurrentEvents } from '../current/useCurrentEvents';
import { createRange } from '../history/dateRange';
import { ArchiveView } from './components/ArchiveView';
import { EdgePageLayout } from './components/EdgePageLayout';

export function EdgeHistoryPage() {
  const { edgeId = '' } = useParams();
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(() => createRange(24));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const currentEventsConnected = useCurrentEvents(edgeId);
  const current = useQuery({
    queryKey: ['current', edgeId],
    queryFn: () => getCurrent(edgeId),
    enabled: Boolean(edgeId),
    refetchInterval: currentEventsConnected ? false : 1_000,
  });
  const currentItems = useMemo(() => current.data?.items ?? [], [current.data?.items]);
  const tagLabels = useMemo(() => createCurrentTagLabels(currentItems), [currentItems]);
  const getTagLabel = (tag: string) => tagLabels[tag] ?? tag;
  const visibleItems = useMemo(() => filterCurrentItems(currentItems, search), [currentItems, search]);
  const from = toIsoFromInput(range.from) as string;
  const to = toIsoFromInput(range.to) as string;
  const historyGranularity = useMemo(() => getHistoryGranularity(from, to), [from, to]);
  const selectedTag = selectedTags[0];
  const history = useQuery({
    queryKey: ['history', edgeId, selectedTag, from, to, historyGranularity.granulate],
    queryFn: () =>
      getHistory({
        edge: edgeId,
        tag: selectedTag as string,
        from,
        to,
        granulate: historyGranularity.granulate,
      }),
    enabled: Boolean(edgeId && selectedTag),
    refetchInterval: false,
  });

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
    <EdgePageLayout
      currentEventsConnected={currentEventsConnected}
      edgeId={edgeId}
      view="archive"
      onRefresh={() => {
        void current.refetch();
        void history.refetch();
      }}
    >
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
    </EdgePageLayout>
  );
}
