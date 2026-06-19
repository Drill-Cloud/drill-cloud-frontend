export type EdgeItem = {
  id: string;
  name: string;
  parentId: string | null;
  tagIds: string[];
  tagCount: number;
};

export type EdgeResponse = {
  items: EdgeItem[];
};
