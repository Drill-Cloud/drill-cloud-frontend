import type { EChartsOption } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/esm/core.js';
import { useMemo } from 'react';
import type { DataZoomEventBatch } from './chartTypes';
import { echarts } from './historyChartEcharts';

type HistoryChartAreaProps = {
  hasData: boolean;
  hasSelection: boolean;
  loading: boolean;
  option: EChartsOption;
  onDataZoom: (event: DataZoomEventBatch) => void;
};

/** Отвечает только за визуальную область графика: placeholder или ECharts canvas. */
export function HistoryChartArea({
  hasData,
  hasSelection,
  loading,
  option,
  onDataZoom,
}: HistoryChartAreaProps) {
  const onChartEvents = useMemo(
    () => ({
      datazoom: onDataZoom,
    }),
    [onDataZoom],
  );

  if (!hasSelection) {
    return <div className="chart-placeholder">Разверните список показателей и выберите серию для графика</div>;
  }

  if (!hasData && loading) {
    return <div className="chart-placeholder">Загрузка графика...</div>;
  }

  if (!hasData) {
    return <div className="chart-placeholder">Нет данных для выбранного диапазона</div>;
  }

  return <ReactEChartsCore echarts={echarts} option={option} className="history-chart" onEvents={onChartEvents} lazyUpdate />;
}
