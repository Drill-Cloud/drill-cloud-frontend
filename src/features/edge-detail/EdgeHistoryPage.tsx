import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getCurrent } from '../../entities/current/api';
import { toIsoFromInput } from '../../utils/format';
import { getHistoryGranularity } from '../../utils/historyGranularity';
import { createCurrentTagLabels } from '../current/model';
import { useCurrentEvents } from '../current/useCurrentEvents';
import { createRange } from '../history/dateRange';
import { ArchiveView } from './components/ArchiveView';
import { EdgePageLayout } from './components/EdgePageLayout';

export function EdgeHistoryPage() {
  const { edgeId = '' } = useParams();
  const queryClient = useQueryClient();
  const [range, setRange] = useState(() => createRange(24));
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
  const from = toIsoFromInput(range.from) as string;
  const to = toIsoFromInput(range.to) as string;
  const historyGranularity = useMemo(() => getHistoryGranularity(from, to), [from, to]);

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
        items={currentItems}
        historyGranulate={historyGranularity.granulate}
        historyAxis={historyGranularity}
        range={range}
        onRangeChange={setRange}
        getTagLabel={getTagLabel}
        tagLabels={tagLabels}
      />
    </EdgePageLayout>
  );
}
