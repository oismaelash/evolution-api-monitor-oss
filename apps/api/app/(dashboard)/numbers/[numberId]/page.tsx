import { notFound } from 'next/navigation';
import { prisma } from '@monitor/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DeleteNumberButton } from '@/components/dashboard/delete-number-button';
import { RouterRefreshInterval } from '@/components/dashboard/router-refresh-interval';
import { LocalDateTime } from '@/components/ui/local-datetime';

type Props = { params: Promise<{ numberId: string }> };

export default async function NumberDetailPage({ params }: Props) {
  const { numberId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
  const number = await prisma.number.findFirst({
    where: { id: numberId, project: { userId } },
    include: { project: true },
  });
  if (!number) notFound();

  const checks = await prisma.healthCheck.findMany({
    where: { numberId: number.id },
    orderBy: { checkedAt: 'desc' },
    take: 20,
  });

  return (
    <div>
      <RouterRefreshInterval />
      <h1 className="mb-2 text-2xl font-semibold">{number.instanceName}</h1>
      <p className="mb-2 text-sm text-[var(--color-text-muted)]">
        Project: {number.project.name} · State:{' '}
        <span className="text-[var(--color-text-primary)]">{number.state}</span>
      </p>
      <p className="mb-8 text-sm text-[var(--color-text-muted)]">
        Failure count: {number.failureCount}
      </p>
      <h2 className="mb-4 text-lg font-medium">Recent health checks</h2>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">ms</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c: (typeof checks)[number]) => (
              <tr key={c.id} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-2">
                  <LocalDateTime iso={c.checkedAt.toISOString()} />
                </td>
                <td className="px-4 py-2">{c.status}</td>
                <td className="px-4 py-2">{c.responseTimeMs ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-1 text-lg font-medium text-[var(--color-text-primary)]">Danger zone</h2>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          Remove this number from the project. Health schedules are cleared. The WhatsApp instance on
          Evolution is not deleted on the server—only this monitor&apos;s record.
        </p>
        <DeleteNumberButton
          numberId={number.id}
          instanceName={number.instanceName}
          redirectAfter={`/projects/${number.projectId}`}
        />
      </section>
    </div>
  );
}
