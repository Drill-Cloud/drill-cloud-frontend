import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { getUiSettings, saveUiSettings } from '../api/settings.api';
import { DEFAULT_UI_SETTINGS } from './defaults';
import { UiSettingsContext, type UiSettingsContextValue } from './settings.context';
import type { UiSettings } from './settings.types';
import { normalizeUiSettings } from './settings.validation';

export function UiSettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<UiSettings>(DEFAULT_UI_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getUiSettings()
      .then((response) => {
        if (!active) return;
        setSettings(response.settings ? normalizeUiSettings(response.settings) : DEFAULT_UI_SETTINGS);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setSettings(DEFAULT_UI_SETTINGS);
          setError(`Серверные настройки недоступны, используются значения по умолчанию: ${String(loadError)}`);
        }
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
        setSaving(true);
        try {
          const response = await saveUiSettings(normalized);
          setSettings(response.settings ? normalizeUiSettings(response.settings) : normalized);
          setError(null);
        } catch (saveError) {
          setError(`Не удалось сохранить настройки на сервере: ${String(saveError)}`);
          throw saveError;
        } finally {
          setSaving(false);
        }
      },
      reset: async () => {
        setSaving(true);
        try {
          const response = await saveUiSettings(DEFAULT_UI_SETTINGS);
          setSettings(response.settings ? normalizeUiSettings(response.settings) : DEFAULT_UI_SETTINGS);
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
