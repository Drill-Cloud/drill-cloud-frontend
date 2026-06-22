import { useMemo } from 'react';
import type { SeriesOption } from 'echarts';
import { createSeriesOptions } from './historyChartSeries';
import type { HistoryChartLineData } from './useHistoryChartQueries';

export function useHistoryChartSeries(lines: HistoryChartLineData[]): SeriesOption[] {
  return useMemo(
    () =>
      lines.flatMap((line) =>
        line.rows.length ? createSeriesOptions(line.rows, line.index, line.label) : [],
      ),
    [lines],
  );
}
