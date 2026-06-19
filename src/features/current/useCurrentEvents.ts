import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentEventsUrl } from '../../entities/current/api';
import type { CurrentEvent, CurrentResponse } from '../../entities/current/types';

export function useCurrentEvents(edgeId: string): boolean {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!edgeId || typeof EventSource === 'undefined') {
      setConnected(false);
      return undefined;
    }

    const eventSource = new EventSource(getCurrentEventsUrl(edgeId));

    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => setConnected(false);
    eventSource.onmessage = (message) => {
      const event = JSON.parse(message.data) as CurrentEvent;
      queryClient.setQueryData<CurrentResponse>(['current', edgeId], event);
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [edgeId, queryClient]);

  return connected;
}
