import { DEFAULT_UI_SETTINGS } from './defaults';
import { normalizeUiSettings } from './settings.validation';
import type { UiSettings } from './settings.types';

const SETTINGS_CACHE_KEY = 'drill.ui-settings.v1';
const LEGACY_PLAYER_KEY = 'drill.camera.playbackSettings.v4';

export function readCachedUiSettings(): UiSettings {
  try {
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (cached) return normalizeUiSettings(JSON.parse(cached));

    const legacyPlayer = localStorage.getItem(LEGACY_PLAYER_KEY);
    if (legacyPlayer) {
      const migrated = normalizeUiSettings({ ...DEFAULT_UI_SETTINGS, player: JSON.parse(legacyPlayer) });
      writeCachedUiSettings(migrated);
      localStorage.removeItem(LEGACY_PLAYER_KEY);
      return migrated;
    }
  } catch {
    // Повреждённый кеш не должен блокировать запуск приложения.
  }

  return DEFAULT_UI_SETTINGS;
}

export function writeCachedUiSettings(settings: UiSettings): void {
  localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
}

