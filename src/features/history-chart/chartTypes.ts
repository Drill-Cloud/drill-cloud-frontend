export type AvgPointValue = [time: number, avg: number, min: number, max: number, count: number];

export type TooltipParam = {
  color?: string;
  marker?: string;
  seriesName?: string;
  value?: unknown;
};

export type DataZoomState = {
  start?: number;
  end?: number;
  startValue?: number;
  endValue?: number;
};

export type DataZoomEventBatch = DataZoomState & {
  batch?: DataZoomState[];
};
