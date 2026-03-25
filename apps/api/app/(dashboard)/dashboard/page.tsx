import Link from 'next/link';
import { prisma } from '@monitor/database';
import type { NumberState } from '@monitor/shared';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HealthChart24h } from '@/components/dashboard/health-chart-24h';
import { RouterRefreshInterval } from '@/components/dashboard/router-refresh-interval';
import { LocalDateTime } from '@/components/ui/local-datetime';
import { computeUptimeDisplayPercent } from '@/lib/uptime';

function bucketHour(ts: Date): number {
  return Math.floor(ts.getTime() / (60 * 60 * 1000));
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

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

  const recentAlerts = await prisma.alert.findMany({
    where: { number: { project: { userId } } },
    orderBy: { sentAt: 'desc' },
    take: 10,
    include: { number: true },
  });

  return (
    <div>
      <RouterRefreshInterval />
      <h1 className="mb-2 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-8 text-[var(--color-text-muted)]">Overview of monitored numbers.</p>
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-sm text-[var(--color-text-muted)]">Total numbers</div>
          <div className="text-2xl font-semibold">{total}</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-sm text-[var(--color-text-muted)]">Connected</div>
          <div className="text-2xl font-semibold text-[var(--color-success)]">{connected}</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-sm text-[var(--color-text-muted)]">In error</div>
          <div className="text-2xl font-semibold text-[var(--color-error)]">{errors}</div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-medium">Health checks (24h)</h2>
      <HealthChart24h buckets={chartBuckets} />

      <h2 className="mb-4 text-lg font-medium">Uptime (24h) by number</h2>
      <div className="mb-10 overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-2">Instance</th>
              <th className="px-4 py-2">Uptime</th>
            </tr>
          </thead>
          <tbody>
            {uptimeRows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-[var(--color-text-muted)]" colSpan={2}>
                  No numbers yet.
                </td>
              </tr>
            ) : (
              uptimeRows.map((u) => (
                <tr key={u.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-2">
                    <Link href={`/numbers/${u.id}`} className="text-[var(--color-accent)] hover:underline">
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 max-w-xs overflow-hidden rounded-full bg-[var(--color-border)]">
                        <div
                          className="h-full bg-[var(--color-success)]"
                          style={{ width: `${u.pct}%` }}
                        />
                      </div>
                      <span className="text-[var(--color-text-muted)]">{u.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-4 text-lg font-medium">Recent alerts</h2>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Instance</th>
              <th className="px-4 py-2">Channel</th>
            </tr>
          </thead>
          <tbody>
            {recentAlerts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-[var(--color-text-muted)]" colSpan={3}>
                  No alerts yet.
                </td>
              </tr>
            ) : (
              recentAlerts.map((a: (typeof recentAlerts)[number]) => (
                <tr key={a.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-2">
                    <LocalDateTime iso={a.sentAt.toISOString()} />
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/numbers/${a.numberId}`}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      {a.number.instanceName}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{a.channel}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
