import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { getUiSettings, saveUiSettings } from '../api/settings.api';
import { DEFAULT_UI_SETTINGS } from './defaults';
import { UiSettingsContext, type UiSettingsContextValue } from './settings.context';
import { readCachedUiSettings, writeCachedUiSettings } from './settings.storage';
import type { UiSettings } from './settings.types';
import { normalizeUiSettings } from './settings.validation';

export function UiSettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<UiSettings>(readCachedUiSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialSettingsRef = useRef(settings);

  useEffect(() => {
    let active = true;

    void getUiSettings()
      .then(async (response) => {
        if (!active) return;
        if (response.settings) {
          const normalized = normalizeUiSettings(response.settings);
          setSettings(normalized);
          writeCachedUiSettings(normalized);
        } else {
          await saveUiSettings(initialSettingsRef.current);
        }
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (active) setError(`Серверные настройки недоступны, используется локальный кеш: ${String(loadError)}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<UiSettingsContextValue>(
    () => ({
      settings,
      loading,
      saving,
      error,
      save: async (nextSettings) => {
        const normalized = normalizeUiSettings(nextSettings);
        setSettings(normalized);
        writeCachedUiSettings(normalized);
        setSaving(true);
        try {
          await saveUiSettings(normalized);
          setError(null);
        } catch (saveError) {
          setError(`Не удалось сохранить настройки на сервере: ${String(saveError)}`);
          throw saveError;
        } finally {
          setSaving(false);
        }
      },
      reset: async () => {
        setSettings(DEFAULT_UI_SETTINGS);
        writeCachedUiSettings(DEFAULT_UI_SETTINGS);
        setSaving(true);
        try {
          await saveUiSettings(DEFAULT_UI_SETTINGS);
          setError(null);
        } catch (resetError) {
          setError(`Не удалось сбросить серверные настройки: ${String(resetError)}`);
          throw resetError;
        } finally {
          setSaving(false);
        }
      },
    }),
    [error, loading, saving, settings],
  );

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-screen-card">
          <h1>Drill UI</h1>
          <p>Загружаем настройки интерфейса...</p>
        </div>
      </div>
    );
  }

  return <UiSettingsContext.Provider value={value}>{children}</UiSettingsContext.Provider>;
}
