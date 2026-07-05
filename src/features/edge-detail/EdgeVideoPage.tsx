import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getCameras } from '../../entities/camera/api';
import { EdgePageLayout } from './components/EdgePageLayout';
import { VideoView } from './components/VideoView';

export function EdgeVideoPage() {
  const { edgeId = '' } = useParams();
  const cameras = useQuery({
    queryKey: ['camera', edgeId],
    queryFn: () => getCameras(edgeId),
    enabled: Boolean(edgeId),
  });
  const cameraItems = useMemo(() => cameras.data?.items ?? [], [cameras.data?.items]);

  return (
    <EdgePageLayout
      currentEventsConnected={false}
      edgeId={edgeId}
      view="video"
      onRefresh={() => void cameras.refetch()}
    >
      <VideoView cameras={cameraItems} loading={cameras.isPending} isError={cameras.isError} error={cameras.error} />
    </EdgePageLayout>
  );
}
