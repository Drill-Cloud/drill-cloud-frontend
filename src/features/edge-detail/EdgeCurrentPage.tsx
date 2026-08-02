import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getCurrent } from '../../entities/current/api';
import { createCurrentTagLabels, filterCurrentItems } from '../current/model';
import { useCurrentEvents } from '../current/useCurrentEvents';
import { EdgePageLayout } from './components/EdgePageLayout';
import { IndicatorsView } from './components/IndicatorsView';

export function EdgeCurrentPage() {
  const { edgeId = '' } = useParams();
  const [search, setSearch] = useState('');
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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((selected) => selected !== tag) : [...prev, tag]));
  };

  return (
    <EdgePageLayout
      currentEventsConnected={currentEventsConnected}
      edgeId={edgeId}
      view="indicators"
      onRefresh={() => void current.refetch()}
    >
      <IndicatorsView
        edgeId={edgeId}
        items={visibleItems}
        search={search}
        isError={current.isError}
        error={current.error}
        selectedTags={selectedTags}
        getTagLabel={getTagLabel}
        onSearchChange={setSearch}
        onToggleTag={toggleTag}
      />
    </EdgePageLayout>
  );
}
