import type { CurrentItem } from '../../entities/current/types';

export type LiveValue = CurrentItem & {
  sourceKey: string;
};

export type BindingTag = {
  tagId: string;
  edgeId: string;
  sourceKey: string;
  sseUrl?: string;
};

export type LiveGroup = {
  sourceKey: string;
  edgeId: string;
  sseUrl?: string;
  tags: string[];
};
