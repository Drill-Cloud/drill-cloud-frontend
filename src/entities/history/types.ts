export type HistoryPoint = {
  time: string;
  min_value: number;
  avg_value: number;
  max_value: number;
  point_count: number;
};

export type HistoryResponse = {
  rows: HistoryPoint[];
};

export type HistoryRequest = {
  edge: string;
  tag: string;
  from: string;
  to: string;
  granulate: string;
};
