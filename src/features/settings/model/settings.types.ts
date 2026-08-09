export const LIVE_GRANULATE_VALUES = ['1 second', '5 seconds', '10 seconds', '30 seconds', '1 minute'] as const;

export type LiveGranulate = (typeof LIVE_GRANULATE_VALUES)[number];

export type UiSettings = {
  version: 1;
  player: {
    liveBufferLatencyMaxLatency: number;
    liveBufferLatencyMinRemain: number;
    stashInitialSize: number;
    autoCleanupMaxBackwardDuration: number;
    autoCleanupMinBackwardDuration: number;
  };
  liveChart: {
    windowMinutes: number;
    shiftIntervalMs: number;
    fallbackPollingMs: number;
    granulate: LiveGranulate;
    maxPointsPerTag: number;
  };
  archiveChart: {
    defaultPeriodHours: number;
  };
  interface: {
    sidebarCollapsed: boolean;
  };
};

