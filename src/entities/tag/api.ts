import { getJson } from '../../shared/api/http';
import { cloudApiUrl } from '../../shared/config/env';
import type { TagResponse } from './types';

/** Загружает справочник тегов; tag.name используется как отображаемое имя. */
export function getTags(params: { edge?: string; search?: string } = {}): Promise<TagResponse> {
  return getJson<TagResponse>(cloudApiUrl, '/tag', params);
}
