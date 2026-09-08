import { useMemo } from 'react';
import { keepPreviousData, useQueries } from '@tanstack/react-query';
import { getHistory } from '../../entities/history/api';
import type { HistoryPoint } from '../../entities/history/types';
import { UNKNOWN_TAG_COLOR } from '../../entities/tag/color';

type UseHistoryChartQueriesParams = {
  edge: string;
  from: string;
  granulate: string;
  tags: string[];
  to: string;
  tagLabels: Record<string, string>;
  tagColors: Record<string, string>;
};

export type HistoryChartLineData = {
  color: string;
  label: string;
  loading: boolean;
  rows: HistoryPoint[];
  tag: string;
};

export function useHistoryChartQueries({
  edge,
  from,
  granulate,
  tags,
  to,
  tagLabels,
  tagColors,
}: UseHistoryChartQueriesParams): HistoryChartLineData[] {
  const enabled = Boolean(edge && from && granulate && to);

  const queries = useQueries({
    queries: tags.map((tag) => ({
      queryKey: ['history', edge, tag, from, to, granulate],
      queryFn: ({ signal }: { signal: AbortSignal }) => getHistory({ edge, tag, from, to, granulate }, signal),
      enabled,
      placeholderData: keepPreviousData,
    })),
  });

  return useMemo(
    () =>
      tags.map((tag, index) => ({
        color: tagColors[tag] ?? UNKNOWN_TAG_COLOR,
        label: tagLabels[tag] ?? tag,
        loading: enabled && queries[index].isPending,
        rows: queries[index].data?.rows ?? [],
        tag,
      })),
    [enabled, queries, tagColors, tagLabels, tags],
  );
}
