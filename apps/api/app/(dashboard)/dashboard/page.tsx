import Link from 'next/link';
import { prisma } from '@pilot/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

  const recentAlerts = await prisma.alert.findMany({
    where: { number: { project: { userId } } },
    orderBy: { sentAt: 'desc' },
    take: 10,
    include: { number: true },
  });

  return (
    <div>
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
              recentAlerts.map((a) => (
                <tr key={a.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-2">{a.sentAt.toISOString()}</td>
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
