import type { PropsWithChildren } from 'react';

type CameraViewsContainerProps = PropsWithChildren;

export function CameraViewsContainer({ children }: CameraViewsContainerProps) {
  return <div className="camera-views-grid">{children}</div>;
}
