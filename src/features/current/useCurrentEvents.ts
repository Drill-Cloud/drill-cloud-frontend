import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '../../auth/keycloak';
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

    let eventSource: EventSource | null = null;
    let active = true;

    async function connect() {
      const token = await getAccessToken();

      if (!active) {
        return;
      }

      eventSource = new EventSource(getCurrentEventsUrl(edgeId, undefined, token ?? undefined));

      eventSource.onopen = () => setConnected(true);
      eventSource.onerror = () => setConnected(false);
      eventSource.onmessage = (message) => {
        const event = JSON.parse(message.data) as CurrentEvent;
        queryClient.setQueryData<CurrentResponse>(['current', edgeId], event);
      };
    }

    void connect();

    return () => {
      active = false;
      eventSource?.close();
      setConnected(false);
    };
  }, [edgeId, queryClient]);

  return connected;
}
