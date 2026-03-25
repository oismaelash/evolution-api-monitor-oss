import { prisma } from '@monitor/database';
import type { NumberState } from '@monitor/shared';
import type { DashboardOverviewPayload } from '@/lib/dashboard-overview-types';
import { computeUptimeDisplayPercent } from '@/lib/uptime';

function bucketHour(ts: Date): number {
  return Math.floor(ts.getTime() / (60 * 60 * 1000));
}

export const DashboardService = {
  async getOverview(userId: string): Promise<DashboardOverviewPayload> {
    const [total, connected, errors] = await Promise.all([
      prisma.number.count({ where: { project: { userId } } }),
      prisma.number.count({
        where: { project: { userId }, state: 'CONNECTED' },
      }),
      prisma.number.count({
        where: { project: { userId }, state: 'ERROR' },
      }),
    ]);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const checks = await prisma.healthCheck.findMany({
      where: { number: { project: { userId } }, checkedAt: { gte: since } },
      select: { checkedAt: true, status: true },
      orderBy: { checkedAt: 'asc' },
      take: 5000,
    });

    const buckets = new Map<number, { ok: number; fail: number }>();
    for (const c of checks) {
      const b = bucketHour(c.checkedAt);
      const cur = buckets.get(b) ?? { ok: 0, fail: 0 };
      if (c.status === 'HEALTHY') cur.ok += 1;
      else cur.fail += 1;
      buckets.set(b, cur);
    }
    const chartBuckets: { ts: number; ok: number; fail: number }[] = [];
    const now = Date.now();
    for (let i = 23; i >= 0; i--) {
      const t = new Date(now - i * 60 * 60 * 1000);
      const b = bucketHour(t);
      const v = buckets.get(b) ?? { ok: 0, fail: 0 };
      chartBuckets.push({
        ts: t.getTime(),
        ok: v.ok,
        fail: v.fail,
      });
    }

    const uptimeRows = await Promise.all(
      (
        await prisma.number.findMany({
          where: { project: { userId } },
          select: { id: true, instanceName: true, state: true },
          take: 20,
        })
      ).map(async (n: { id: string; instanceName: string; state: NumberState }) => {
        const u24 = await prisma.healthCheck.groupBy({
          by: ['status'],
          where: { numberId: n.id, checkedAt: { gte: since } },
          _count: { _all: true },
        });
        const ok = u24.find((r) => r.status === 'HEALTHY')?._count._all ?? 0;
        const bad = u24.find((r) => r.status === 'UNHEALTHY')?._count._all ?? 0;
        const pct = computeUptimeDisplayPercent(ok, bad, n.state);
        return { id: n.id, name: n.instanceName, pct };
      })
    );

    const recentAlertsRaw = await prisma.alert.findMany({
      where: { number: { project: { userId } } },
      orderBy: { sentAt: 'desc' },
      take: 10,
      include: { number: true },
    });

    const recentAlerts = recentAlertsRaw.map((a) => ({
      id: a.id,
      sentAt: a.sentAt.toISOString(),
      numberId: a.numberId,
      channel: a.channel,
      instanceName: a.number.instanceName,
    }));

    return {
      stats: { total, connected, errors },
      chartBuckets,
      uptimeRows,
      recentAlerts,
    };
  },
};
