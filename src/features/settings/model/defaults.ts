import type { UiSettings } from './settings.types';

export const DEFAULT_UI_SETTINGS: UiSettings = {
  version: 1,
  player: {
    liveBufferLatencyMaxLatency: 24,
    liveBufferLatencyMinRemain: 8,
    stashInitialSize: 256 * 1024,
    autoCleanupMaxBackwardDuration: 20,
    autoCleanupMinBackwardDuration: 8,
  },
  liveChart: {
    windowMinutes: 25,
    shiftIntervalMs: 5_000,
    fallbackPollingMs: 1_000,
    granulate: '5 seconds',
    maxPointsPerTag: 300,
  },
  archiveChart: {
    defaultPeriodHours: 24,
  },
  interface: {
    sidebarCollapsed: false,
  },
};

