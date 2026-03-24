import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@monitor/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SyncInstancesButton } from '@/components/dashboard/sync-instances-button';

type Props = { params: { projectId: string } };

export default async function ProjectDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
  const project = await prisma.project.findFirst({
    where: { id: params.projectId, userId },
    include: {
      config: true,
      numbers: { orderBy: { updatedAt: 'desc' }, take: 50 },
    },
  });
  if (!project) notFound();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">{project.name}</h1>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        Evolution URL: {project.evolutionUrl}
      </p>
      <div className="mb-6">
        <SyncInstancesButton projectId={project.id} />
      </div>
      <h2 className="mb-4 text-lg font-medium">Numbers</h2>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-2">Instance</th>
              <th className="px-4 py-2">State</th>
              <th className="px-4 py-2">Monitored</th>
            </tr>
          </thead>
          <tbody>
            {project.numbers.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-[var(--color-text-muted)]" colSpan={3}>
                  No numbers yet. Sync instances or add manually via API.
                </td>
              </tr>
            ) : (
              project.numbers.map((n: (typeof project.numbers)[number]) => (
                <tr key={n.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-2">
                    <Link
                      href={`/numbers/${n.id}`}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      {n.instanceName}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{n.state}</td>
                  <td className="px-4 py-2">{n.monitored ? 'yes' : 'no'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
