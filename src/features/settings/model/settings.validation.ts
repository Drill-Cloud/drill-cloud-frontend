import { DEFAULT_UI_SETTINGS } from './defaults';
import { LIVE_GRANULATE_VALUES, type LiveGranulate, type UiSettings } from './settings.types';

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function numberValue(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function integerValue(value: unknown, fallback: number, min: number, max: number): number {
  return Math.round(numberValue(value, fallback, min, max));
}

function granulateValue(value: unknown): LiveGranulate {
  return LIVE_GRANULATE_VALUES.includes(value as LiveGranulate)
    ? (value as LiveGranulate)
    : DEFAULT_UI_SETTINGS.liveChart.granulate;
}

export function normalizeUiSettings(value: unknown): UiSettings {
  const root = objectValue(value);
  const player = objectValue(root.player);
  const liveChart = objectValue(root.liveChart);
  const archiveChart = objectValue(root.archiveChart);
  const interfaceSettings = objectValue(root.interface);

  const maxLatency = numberValue(
    player.liveBufferLatencyMaxLatency,
    DEFAULT_UI_SETTINGS.player.liveBufferLatencyMaxLatency,
    1,
    120,
  );
  const minRemain = numberValue(
    player.liveBufferLatencyMinRemain,
    DEFAULT_UI_SETTINGS.player.liveBufferLatencyMinRemain,
    0.5,
    Math.min(60, maxLatency),
  );
  const cleanupMax = numberValue(
    player.autoCleanupMaxBackwardDuration,
    DEFAULT_UI_SETTINGS.player.autoCleanupMaxBackwardDuration,
    5,
    180,
  );

  return {
    version: 1,
    player: {
      liveBufferLatencyMaxLatency: maxLatency,
      liveBufferLatencyMinRemain: minRemain,
      stashInitialSize: integerValue(player.stashInitialSize, DEFAULT_UI_SETTINGS.player.stashInitialSize, 64 * 1024, 4 * 1024 * 1024),
      autoCleanupMaxBackwardDuration: cleanupMax,
      autoCleanupMinBackwardDuration: numberValue(
        player.autoCleanupMinBackwardDuration,
        DEFAULT_UI_SETTINGS.player.autoCleanupMinBackwardDuration,
        1,
        Math.min(120, cleanupMax),
      ),
    },
    liveChart: {
      windowMinutes: integerValue(liveChart.windowMinutes, DEFAULT_UI_SETTINGS.liveChart.windowMinutes, 1, 120),
      shiftIntervalMs: integerValue(liveChart.shiftIntervalMs, DEFAULT_UI_SETTINGS.liveChart.shiftIntervalMs, 1_000, 60_000),
      fallbackPollingMs: integerValue(liveChart.fallbackPollingMs, DEFAULT_UI_SETTINGS.liveChart.fallbackPollingMs, 1_000, 60_000),
      granulate: granulateValue(liveChart.granulate),
      maxPointsPerTag: integerValue(liveChart.maxPointsPerTag, DEFAULT_UI_SETTINGS.liveChart.maxPointsPerTag, 50, 5_000),
    },
    archiveChart: {
      defaultPeriodHours: integerValue(
        archiveChart.defaultPeriodHours,
        DEFAULT_UI_SETTINGS.archiveChart.defaultPeriodHours,
        1,
        24 * 365,
      ),
    },
    interface: {
      sidebarCollapsed:
        typeof interfaceSettings.sidebarCollapsed === 'boolean'
          ? interfaceSettings.sidebarCollapsed
          : DEFAULT_UI_SETTINGS.interface.sidebarCollapsed,
    },
  };
}
