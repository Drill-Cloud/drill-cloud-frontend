export type HistoryPoint = {
  t: number;
  min: number;
  avg: number;
  max: number;
  count: number;
};

export type HistorySeries = {
  edge: string;
  tag: string;
  points: HistoryPoint[];
};

export type HistoryResponse = {
  edge: string;
  tag: string;
  granulate: string;
  series: HistorySeries[];
  from: string;
  to: string;
};

export type HistoryRequest = {
  edge: string;
  tag: string;
  from: string;
  to: string;
  granulate: string;
};
