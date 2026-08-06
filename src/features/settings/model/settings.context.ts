import { createContext, useContext } from 'react';
import type { UiSettings } from './settings.types';

export type UiSettingsContextValue = {
  settings: UiSettings;
  loading: boolean;
  saving: boolean;
  error: string | null;
  save: (settings: UiSettings) => Promise<void>;
  reset: () => Promise<void>;
};

export const UiSettingsContext = createContext<UiSettingsContextValue | null>(null);

export function useUiSettings(): UiSettingsContextValue {
  const context = useContext(UiSettingsContext);
  if (!context) throw new Error('useUiSettings must be used inside UiSettingsProvider');
  return context;
}

