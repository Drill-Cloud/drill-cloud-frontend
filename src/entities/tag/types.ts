export type TagItem = {
  id: string;
  name: string;
  tagGroup: string | null;
  min: number | null;
  max: number | null;
  comment: string;
  unitOfMeasurement: string;
  edgeIds: string[];
  precision: number | null;
  color: string;
};

export type TagResponse = {
  items: TagItem[];
};
