export type HealthResponse = {
  status: 'ok';
  database: {
    now: string;
    timescaledb_installed: boolean;
    timescaledb_version: string | null;
  };
};
