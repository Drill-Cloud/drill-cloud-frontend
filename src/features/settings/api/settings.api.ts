import { getAccessToken } from '../../../auth/keycloak';
import type { UiSettings } from '../model/settings.types';

type UiSettingsResponse = {
  settings: UiSettings | null;
  updatedAt: string | null;
};

async function request(method: 'GET' | 'PUT' | 'DELETE', settings?: UiSettings): Promise<UiSettingsResponse> {
  const token = await getAccessToken();
  const response = await fetch('/api/me/ui-settings', {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(settings ? { 'Content-Type': 'application/json' } : {}),
    },
    body: settings ? JSON.stringify(settings) : undefined,
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<UiSettingsResponse>;
}

export const getUiSettings = () => request('GET');
export const saveUiSettings = (settings: UiSettings) => request('PUT', settings);
