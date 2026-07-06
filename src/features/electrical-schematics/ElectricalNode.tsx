import { type CSSProperties } from 'react';
import { Activity, AlertTriangle, PlugZap } from 'lucide-react';
import type { DiagramNode } from '../../entities/diagram/types';
import { formatNumber } from '../../utils/format';
import { getNodeSize } from './geometry';
import { getLiveValue } from './model';
import type { LiveValue } from './types';

function getNodeTitle(node: DiagramNode, value?: LiveValue) {
  if (node.kind === 'tagWidget') {
    return node.label || value?.name || node.tagId;
  }

  return String(node.data?.title || node.data?.text || node.decorationType);
}

type ElectricalNodeProps = {
  liveValues: Map<string, LiveValue>;
  node: DiagramNode;
  ownerEdgeId: string;
};

export function ElectricalNode({ liveValues, node, ownerEdgeId }: ElectricalNodeProps) {
  const size = getNodeSize(node);
  const bindings = node.kind === 'decoration' ? node.bindings : undefined;
  const bindingEdgeId = bindings?.sseEdgeId || bindings?.edgeId || ownerEdgeId;
  const mainValue =
    node.kind === 'tagWidget'
      ? getLiveValue(liveValues, node.edgeId || ownerEdgeId, node.tagId)
      : getLiveValue(liveValues, bindingEdgeId, bindings?.stateTagId);
  const alarmValue = node.kind === 'decoration' ? getLiveValue(liveValues, bindingEdgeId, bindings?.alarmTagId) : undefined;
  const alarmActive = Boolean(alarmValue && alarmValue.value !== null && alarmValue.value !== 0);
  const stateActive = Boolean(mainValue && mainValue.value !== null && mainValue.value !== 0);
  const title = getNodeTitle(node, mainValue);
  const style: CSSProperties = {
    left: node.position.x,
    top: node.position.y,
    width: size.width,
    height: size.height,
    zIndex: node.zIndex ?? 1,
    transform: node.kind === 'decoration' && node.rotation ? `rotate(${node.rotation}deg)` : undefined,
  };

  return (
    <article
      className={[
        'electrical-node',
        `electrical-node--${node.kind}`,
        node.kind === 'decoration' ? `electrical-node--${node.decorationType}` : `electrical-node--${node.widgetType}`,
        stateActive ? 'electrical-node--active' : '',
        alarmActive ? 'electrical-node--alarm' : '',
      ].join(' ')}
      style={style}
      title={title}
    >
      <div className="electrical-node__header">
        {alarmActive ? <AlertTriangle size={15} /> : node.kind === 'tagWidget' ? <Activity size={15} /> : <PlugZap size={15} />}
        <span>{title}</span>
      </div>

      {mainValue ? (
        <strong className="electrical-node__value">
          {formatNumber(mainValue.value)}
          {mainValue.unitOfMeasurement ? <small>{mainValue.unitOfMeasurement}</small> : null}
        </strong>
      ) : node.kind === 'decoration' ? (
        <span className="electrical-node__text">{String(node.data?.text || node.data?.title || node.decorationType)}</span>
      ) : (
        <strong className="electrical-node__value">-</strong>
      )}

      <div className="electrical-node__footer">
        {node.kind === 'tagWidget' ? <span>{node.tagId}</span> : bindings?.stateTagId ? <span>{bindings.stateTagId}</span> : <span>{node.decorationType}</span>}
        {alarmValue ? <span className="electrical-node__alarm">alarm {formatNumber(alarmValue.value)}</span> : null}
      </div>
    </article>
  );
}
