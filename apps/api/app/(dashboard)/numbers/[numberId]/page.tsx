import { notFound } from 'next/navigation';
import { prisma } from '@monitor/database';
import { buildPaginationMeta } from '@monitor/shared';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServerTranslator } from '@/lib/i18n-server';
import { DeleteNumberButton } from '@/components/dashboard/delete-number-button';
import { NumberDetailPolling } from '@/components/dashboard/number-detail-polling';

type Props = { params: Promise<{ numberId: string }> };

export default async function NumberDetailPage({ params }: Props) {
  const t = await getServerTranslator();
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
  const totalChecks = await prisma.healthCheck.count({ where: { numberId: number.id } });

  const initialHeader = {
    instanceName: number.instanceName,
    state: number.state,
    failureCount: number.failureCount,
    project: { name: number.project.name },
  };

  const initialChecksPayload = {
    data: checks.map((c) => ({
      id: c.id,
      checkedAt: c.checkedAt.toISOString(),
      status: c.status,
      responseTimeMs: c.responseTimeMs,
    })),
    meta: buildPaginationMeta(1, 20, totalChecks),
  };

  return (
    <div>
      <NumberDetailPolling
        numberId={number.id}
        initialHeader={initialHeader}
        initialChecksPayload={initialChecksPayload}
      />

      <section className="mt-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-1 text-lg font-medium text-[var(--color-text-primary)]">
          {t('Zona de perigo', 'Danger zone')}
        </h2>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          {t(
            'Remova este número do projeto. Os agendamentos de health são limpos. A instância WhatsApp na Evolution não é apagada no servidor — apenas o registro deste monitor.',
            "Remove this number from the project. Health schedules are cleared. The WhatsApp instance on Evolution is not deleted on the server—only this monitor's record.",
          )}
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
