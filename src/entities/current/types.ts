export type CurrentItem = {
  edge: string;
  tag: string;
  value: number;
  createdAt: string;
  updatedAt: string;
  time: string;
  name: string | null;
  tagGroup: string | null;
  min: number | null;
  max: number | null;
  comment: string | null;
  unitOfMeasurement: string | null;
  precision: number | null;
};

export type CurrentResponse = {
  edge: string;
  items: CurrentItem[];
};

export type CurrentEvent = CurrentResponse;
