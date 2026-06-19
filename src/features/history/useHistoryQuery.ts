import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHistory } from '../../entities/history/api';
import { toIsoFromInput } from '../../utils/format';
import { getHistoryGranularity } from '../../utils/historyGranularity';
import type { DateRangeState } from './dateRange';

export function useHistoryQuery(edgeId: string, selectedTag: string | undefined, range: DateRangeState) {
  const from = toIsoFromInput(range.from) as string;
  const to = toIsoFromInput(range.to) as string;
  const granularity = useMemo(() => getHistoryGranularity(from, to), [from, to]);

  const query = useQuery({
    queryKey: ['history', edgeId, selectedTag, from, to, granularity.granulate],
    queryFn: () =>
      getHistory({
        edge: edgeId,
        tag: selectedTag as string,
        from,
        to,
        granulate: granularity.granulate,
      }),
    enabled: Boolean(edgeId && selectedTag),
    refetchInterval: false,
  });

  return { query, from, to, granularity };
}
