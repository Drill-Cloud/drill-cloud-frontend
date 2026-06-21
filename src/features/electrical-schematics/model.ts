import type { DiagramDocument, DiagramPageSummary } from '../../entities/diagram/types';
import type { BindingTag, LiveGroup, LiveValue } from './types';

const DEFAULT_PAGE_PREFIXES = ['ELECTRICAL', 'MAIN', 'DIRECT'];

export function pickDefaultPage(pages: DiagramPageSummary[], edgeId: string): DiagramPageSummary | undefined {
  const published = pages.filter((page) => page.publishedRevision);
  const byPriority = [...published].sort((a, b) => {
    const aRank = getPageRank(a.pageKey, edgeId);
    const bRank = getPageRank(b.pageKey, edgeId);
    return aRank - bRank || a.pageKey.localeCompare(b.pageKey);
  });

  return byPriority[0];
}

function getPageRank(pageKey: string, edgeId: string): number {
  const exactKeys = DEFAULT_PAGE_PREFIXES.map((prefix) => (prefix === 'DIRECT' ? edgeId : `${prefix}_${edgeId}`));
  const exactIndex = exactKeys.indexOf(pageKey);
  if (exactIndex >= 0) {
    return exactIndex;
  }

  return pageKey.includes(edgeId) ? 10 : 20;
}

export function collectBindingTags(document: DiagramDocument): BindingTag[] {
  const tags: BindingTag[] = [];

  for (const node of document.nodes) {
    if (node.kind === 'tagWidget') {
      tags.push({
        tagId: node.tagId,
        edgeId: node.edgeId || document.ownerEdgeId,
        sourceKey: `edge:${node.edgeId || document.ownerEdgeId}`,
      });
      continue;
    }

    const bindings = node.bindings;
    if (!bindings) {
      continue;
    }

    const edgeId = bindings.sseEdgeId || bindings.edgeId || document.ownerEdgeId;
    const sourceKey = bindings.sseUrl || `edge:${edgeId}`;

    [bindings.stateTagId, bindings.alarmTagId].filter(Boolean).forEach((tagId) => {
      tags.push({
        tagId: tagId as string,
        edgeId,
        sourceKey,
        sseUrl: bindings.sseUrl,
      });
    });
  }

  const unique = new Map<string, BindingTag>();
  tags.forEach((tag) => unique.set(`${tag.sourceKey}:${tag.edgeId}:${tag.tagId}`, tag));
  return Array.from(unique.values());
}

export function createLiveGroups(tags: BindingTag[]): LiveGroup[] {
  const groups = new Map<string, LiveGroup>();

  tags.forEach((tag) => {
    const group = groups.get(tag.sourceKey) ?? {
      sourceKey: tag.sourceKey,
      edgeId: tag.edgeId,
      sseUrl: tag.sseUrl,
      tags: [],
    };

    if (!group.tags.includes(tag.tagId)) {
      group.tags.push(tag.tagId);
    }

    groups.set(tag.sourceKey, group);
  });

  return Array.from(groups.values());
}

export function getLiveValue(values: Map<string, LiveValue>, edgeId: string, tagId?: string): LiveValue | undefined {
  if (!tagId) {
    return undefined;
  }

  return values.get(`${edgeId}:${tagId}`) ?? values.get(`tag:${tagId}`);
}
