import type { CurrentItem } from '../../entities/current/types';

export function getCurrentItemLabel(item: CurrentItem): string {
  return item.name?.trim() || item.tag;
}

export function createCurrentTagLabels(items: CurrentItem[]): Record<string, string> {
  return Object.fromEntries(items.map((item) => [item.tag, getCurrentItemLabel(item)]));
}

export function filterCurrentItems(items: CurrentItem[], search: string): CurrentItem[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return items;
  }

  return items.filter((item) =>
    [item.tag, item.name, item.comment, item.tagGroup, item.unitOfMeasurement]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query),
  );
}

export function getLatestCurrentUpdatedAt(items: CurrentItem[]): Date | undefined {
  const latest = items.reduce<number | null>((max, item) => {
    const updatedAt = new Date(item.updatedAt).getTime();
    return Number.isFinite(updatedAt) && (max === null || updatedAt > max) ? updatedAt : max;
  }, null);

  return latest === null ? undefined : new Date(latest);
}

export function countLiveCurrentItems(items: CurrentItem[], now = Date.now()): number {
  return items.filter((item) => (now - new Date(item.time).getTime()) / 1000 <= 30).length;
}
