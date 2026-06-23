import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getCurrent } from '../../entities/current/api';
import { toIsoFromInput } from '../../utils/format';
import { getHistoryGranularity } from '../../utils/historyGranularity';
import { createCurrentTagLabels, filterCurrentItems } from '../current/model';
import { useCurrentEvents } from '../current/useCurrentEvents';
import { createRange } from '../history/dateRange';
import { ArchiveView } from './components/ArchiveView';
import { EdgePageLayout } from './components/EdgePageLayout';

export function EdgeHistoryPage() {
  const { edgeId = '' } = useParams();
  const queryClient = useQueryClient();
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
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((selected) => selected !== tag) : [...prev, tag]));
  };

  const selectFirstTags = () => {
    setSelectedTags(visibleItems[0] ? [visibleItems[0].tag] : []);
  };

  const selectVisibleTags = () => {
    setSelectedTags((prev) => Array.from(new Set([...prev, ...visibleItems.map((item) => item.tag)])));
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
        void queryClient.invalidateQueries({ queryKey: ['history', edgeId] });
      }}
    >
      <ArchiveView
        edgeId={edgeId}
        items={visibleItems}
        search={search}
        selectedTags={selectedTags}
        historyGranulate={historyGranularity.granulate}
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
