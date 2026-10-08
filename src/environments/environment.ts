export type DataMode = 'synthetic' | 'live' | 'failover';

export const environment = {
  apiBase: 'http://localhost:8080',
  mode: 'failover' as DataMode,
};
