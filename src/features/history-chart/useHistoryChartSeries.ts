import { useMemo } from 'react';
import type { SeriesOption } from 'echarts';
import { createAvgLineSeries } from './historyChartAvgLineSeries';
import { createSeriesOptions } from './historyChartSeries';
import type { HistoryChartLineData } from './useHistoryChartQueries';
import type { AvgLineMode } from './chartTypes';

export function useHistoryChartSeries(
  lines: HistoryChartLineData[],
  granulate: string,
  avgLineMode: AvgLineMode,
  showAvgLine: boolean,
): SeriesOption[] {
  return useMemo(
    () =>
      lines.flatMap((line) =>
        line.rows.length
          ? [
              ...createSeriesOptions(line.rows, line.color, line.label, granulate),
              ...createAvgLineSeries(line.rows, line.color, line.label, granulate, showAvgLine, avgLineMode === 'auto'),
            ]
          : [],
      ),
    [granulate, lines, showAvgLine, avgLineMode],
  );
}
