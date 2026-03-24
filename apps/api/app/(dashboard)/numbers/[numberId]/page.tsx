import { notFound } from 'next/navigation';
import { prisma } from '@monitor/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type Props = { params: { numberId: string } };

export default async function NumberDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
  const number = await prisma.number.findFirst({
    where: { id: params.numberId, project: { userId } },
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
                <td className="px-4 py-2">{c.checkedAt.toISOString()}</td>
                <td className="px-4 py-2">{c.status}</td>
                <td className="px-4 py-2">{c.responseTimeMs ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
