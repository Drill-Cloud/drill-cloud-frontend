import type { DiagramDocument, DiagramEdge, DiagramNode, DiagramPoint } from '../../entities/diagram/types';

export function getCanvasBounds(document?: DiagramDocument) {
  const nodes = document?.nodes ?? [];
  const maxX = Math.max(...nodes.map((node) => node.position.x + getNodeSize(node).width), 960);
  const maxY = Math.max(...nodes.map((node) => node.position.y + getNodeSize(node).height), 560);

  return {
    width: Math.ceil(maxX + 80),
    height: Math.ceil(maxY + 80),
  };
}

export function getNodeSize(node: DiagramNode) {
  if (node.kind === 'decoration') {
    return node.size;
  }

  return node.size ?? { width: 190, height: 82 };
}

export function getNodeCenter(node: DiagramNode): DiagramPoint {
  const size = getNodeSize(node);
  return {
    x: node.position.x + size.width / 2,
    y: node.position.y + size.height / 2,
  };
}

export function getEdgePoints(edge: DiagramEdge, nodeMap: Map<string, DiagramNode>): DiagramPoint[] {
  const source = nodeMap.get(edge.sourceNodeId);
  const target = nodeMap.get(edge.targetNodeId);
  if (!source || !target) {
    return [];
  }

  return [getNodeCenter(source), ...(edge.waypoints ?? []), getNodeCenter(target)];
}

export function pointsToPolyline(points: DiagramPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}
