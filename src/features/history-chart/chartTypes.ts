import type { HistoryAxisLabelFormat } from '../../utils/historyGranularity';

export type AvgPointValue = [time: number, avg: number, min: number, max: number, count: number, slotMs?: number];

export type HistoryBucketValue = [
  time: number,
  avg: number,
  min: number,
  max: number,
  count: number,
  slotMs: number,
];

export type AvgLineMode = 'auto' | 'show' | 'hide';

export type HistoryZoomRange = {
  from: string;
  to: string;
  granulate: string;
  tickIntervalMs?: number;
  labelFormat?: HistoryAxisLabelFormat;
};

export type TooltipParam = {
  color?: string;
  marker?: string;
  seriesName?: string;
  value?: unknown;
};

export type DataZoomState = {
  dataZoomId?: string;
  dataZoomIndex?: number;
  start?: number;
  end?: number;
  startValue?: number;
  endValue?: number;
};

export type DataZoomEventBatch = DataZoomState & {
  batch?: DataZoomState[];
};
