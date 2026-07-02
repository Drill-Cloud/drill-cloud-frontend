import type { PropsWithChildren } from 'react';

type MetricWidgetsContainerProps = PropsWithChildren;

export function MetricWidgetsContainer({ children }: MetricWidgetsContainerProps) {
  return <div className="metric-widgets-grid">{children}</div>;
}
