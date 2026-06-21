import { useEffect, useState } from 'react';
import { getCurrent, getCurrentEventsUrl } from '../../entities/current/api';
import type { CurrentEvent, CurrentResponse } from '../../entities/current/types';
import type { LiveGroup, LiveValue } from './types';

function buildCustomSseUrl(sseUrl: string, tags: string[]): string {
  const url = new URL(sseUrl, window.location.origin);
  if (tags.length && !url.searchParams.has('tags')) {
    tags.forEach((tag) => url.searchParams.append('tags', tag));
  }

  return url.toString();
}

export function useElectricalLiveValues(liveGroups: LiveGroup[], resetKey?: string) {
  const [liveValues, setLiveValues] = useState(() => new Map<string, LiveValue>());
  const [connectedSources, setConnectedSources] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLiveValues(new Map());
    setConnectedSources(new Set());
  }, [resetKey]);

  useEffect(() => {
    if (!liveGroups.length) {
      return undefined;
    }

    let closed = false;
    const eventSources: EventSource[] = [];

    const mergeResponse = (response: CurrentResponse, sourceKey: string) => {
      if (closed) {
        return;
      }

      setLiveValues((previous) => {
        const next = new Map(previous);
        response.items.forEach((item) => {
          const value = { ...item, sourceKey };
          next.set(`${item.edge}:${item.tag}`, value);
          next.set(`tag:${item.tag}`, value);
        });
        return next;
      });
    };

    liveGroups.forEach((group) => {
      if (!group.sseUrl) {
        void getCurrent(group.edgeId, group.tags).then((response) => mergeResponse(response, group.sourceKey));
      }

      const url = group.sseUrl ? buildCustomSseUrl(group.sseUrl, group.tags) : getCurrentEventsUrl(group.edgeId, group.tags);
      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setConnectedSources((previous) => new Set(previous).add(group.sourceKey));
      };

      eventSource.onerror = () => {
        setConnectedSources((previous) => {
          const next = new Set(previous);
          next.delete(group.sourceKey);
          return next;
        });
      };

      eventSource.onmessage = (message) => {
        const event = JSON.parse(message.data) as CurrentEvent;
        mergeResponse(event, group.sourceKey);
      };

      eventSources.push(eventSource);
    });

    return () => {
      closed = true;
      eventSources.forEach((eventSource) => eventSource.close());
    };
  }, [liveGroups]);

  return { connectedSources, liveValues };
}
