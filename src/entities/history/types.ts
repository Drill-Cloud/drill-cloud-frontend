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

export type HistoryBatchPoint = {
  tag: string;
  time: string;
  value: number;
};

export type HistoryBatchResponse = {
  rows: HistoryBatchPoint[];
};

export type HistoryRequest = {
  edge: string;
  tag: string;
  from: string;
  to: string;
  granulate: string;
};

export type HistoryBatchRequest = {
  edge: string;
  tags: string[];
  from: string;
  to: string;
  granulate: string;
};
