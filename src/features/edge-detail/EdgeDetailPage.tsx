import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrent } from '../../entities/current/api';
import {
  countLiveCurrentItems,
  getLatestCurrentUpdatedAt,
} from '../current/model';
import { useCurrentEvents } from '../current/useCurrentEvents';
import { EdgePageLayout } from './components/EdgePageLayout';
import { OverviewView } from './components/OverviewView';

export function EdgeDetailPage() {
  const navigate = useNavigate();
  const { edgeId = '' } = useParams();
  const edgePath = `/edges/${encodeURIComponent(edgeId)}`;
  const currentEventsConnected = useCurrentEvents(edgeId);
  const current = useQuery({
    queryKey: ['current', edgeId],
    queryFn: () => getCurrent(edgeId),
    enabled: Boolean(edgeId),
    refetchInterval: currentEventsConnected ? false : 1_000,
  });
  const currentItems = useMemo(() => current.data?.items ?? [], [current.data?.items]);
  const latestUpdatedAt = useMemo(() => getLatestCurrentUpdatedAt(currentItems), [currentItems]);
  const liveCount = countLiveCurrentItems(currentItems);

  return (
    <EdgePageLayout
      currentEventsConnected={currentEventsConnected}
      edgeId={edgeId}
      view="overview"
      onRefresh={() => void current.refetch()}
    >
      <OverviewView
        edgeId={edgeId}
        totalTags={currentItems.length}
        liveCount={liveCount}
        latestUpdatedAt={latestUpdatedAt}
        onOpenArchive={() => navigate(`${edgePath}/archive`)}
        onOpenIndicators={() => navigate(`${edgePath}/indicators`)}
        onOpenVideo={() => navigate(`${edgePath}/video`)}
      />
    </EdgePageLayout>
  );
}
