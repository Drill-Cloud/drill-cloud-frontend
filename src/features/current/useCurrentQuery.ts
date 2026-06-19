import { useQuery } from '@tanstack/react-query';
import { getCurrent } from '../../entities/current/api';

export function useCurrentQuery(edgeId: string, eventsConnected: boolean) {
  return useQuery({
    queryKey: ['current', edgeId],
    queryFn: () => getCurrent(edgeId),
    enabled: Boolean(edgeId),
    refetchInterval: eventsConnected ? false : 1_000,
  });
}
