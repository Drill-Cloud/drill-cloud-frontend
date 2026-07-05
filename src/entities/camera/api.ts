import { getJson } from '../../shared/api/http';
import { cloudApiUrl } from '../../shared/config/env';
import type { CameraResponse } from './types';

export function getCameras(edge: string): Promise<CameraResponse> {
  return getJson<CameraResponse>(cloudApiUrl, '/camera', { edge });
}
