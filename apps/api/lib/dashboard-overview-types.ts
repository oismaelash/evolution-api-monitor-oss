export type DashboardOverviewPayload = {
  stats: { total: number; connected: number; errors: number };
  chartBuckets: { ts: number; ok: number; fail: number }[];
  uptimeRows: { id: string; name: string; pct: number }[];
  recentAlerts: {
    id: string;
    sentAt: string;
    numberId: string;
    channel: string;
    instanceName: string;
  }[];
};
