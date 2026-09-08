import type { EdgeItem } from './types';

/** Возвращает имя установки из справочника, используя id только для пустого имени. */
export function getEdgeDisplayName(edge: EdgeItem): string {
  return edge.name.trim() || edge.id;
}
