import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@monitor/database';
import { getServerTranslator } from '@/lib/i18n-server';
import { LogService } from '@/services/log.service';
import { LogsFilters } from '@/components/dashboard/logs-filters';
import { LogsTableWithPolling } from '@/components/dashboard/logs-table-with-polling';

type Props = {
  searchParams: Promise<{
    page?: string;
    level?: string;
    projectId?: string;
    numberId?: string;
  }>;
};

export default async function LogsPage({ searchParams }: Props) {
  const t = await getServerTranslator();
  const userId = 'oss-user-id';
  
  const sp = await searchParams;

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      numbers: {
        orderBy: { instanceName: 'asc' },
        select: { id: true, instanceName: true },
      },
    },
  });

  const projectId =
    sp.projectId && projects.some((p) => p.id === sp.projectId) ? sp.projectId : undefined;
  const numberId =
    sp.numberId && projects.some((p) => p.numbers.some((n) => n.id === sp.numberId))
      ? sp.numberId
      : undefined;

  if (projectId && numberId) {
    const p = projects.find((x) => x.id === projectId);
    if (!p?.numbers.some((n) => n.id === numberId)) {
      const qs = new URLSearchParams();
      if (sp.page) qs.set('page', sp.page);
      if (sp.level) qs.set('level', sp.level);
      qs.set('projectId', projectId);
      redirect(`/logs?${qs.toString()}`);
    }
  }

  const qs = new URLSearchParams();
  if (sp.page) qs.set('page', sp.page);
  if (sp.level) qs.set('level', sp.level);
  if (projectId) qs.set('projectId', projectId);
  if (numberId) qs.set('numberId', numberId);

  const { data, meta } = await LogService.listGlobal(userId, qs);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">{t('Logs', 'Logs')}</h1>
      <p className="mb-4 text-[var(--color-text-muted)]">
        {t(
          'Eventos de workers e health checks (mais recentes primeiro).',
          'Monitor events from workers and health checks (newest first).',
        )}
      </p>
      <Suspense
        fallback={
          <div className="mb-4 h-16 animate-pulse rounded-md bg-[var(--color-border)]/40" aria-hidden />
        }
      >
        <LogsFilters
          projects={projects}
          currentProjectId={projectId}
          currentNumberId={numberId}
        />
      </Suspense>
      <LogsTableWithPolling
        initialData={data.map((row) => ({
          id: row.id,
          level: row.level,
          event: row.event,
          errorType: row.errorType,
          createdAt: row.createdAt.toISOString(),
          project: row.project,
          number: row.number,
        }))}
        initialMeta={meta}
        queryString={qs.toString()}
        level={sp.level}
        projectId={projectId}
        numberId={numberId}
      />
    </div>
  );
}
