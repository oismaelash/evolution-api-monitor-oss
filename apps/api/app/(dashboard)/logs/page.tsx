import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@monitor/database';
import { authOptions } from '@/lib/auth';
import { LogService } from '@/services/log.service';
import { LogsFilters } from '@/components/dashboard/logs-filters';

const LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG'] as const;

function levelColor(level: string): string {
  switch (level) {
    case 'ERROR':
      return 'var(--color-error)';
    case 'WARN':
      return 'var(--color-warning)';
    case 'INFO':
      return 'var(--color-accent)';
    default:
      return 'var(--color-text-muted)';
  }
}

type Props = {
  searchParams: Promise<{
    page?: string;
    level?: string;
    projectId?: string;
    numberId?: string;
  }>;
};

export default async function LogsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
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

  const buildHref = (overrides: {
    page?: number;
    level?: string | null;
    projectId?: string | null;
    numberId?: string | null;
  }) => {
    const next = new URLSearchParams();
    const page = overrides.page ?? meta.page;
    const level = overrides.level !== undefined ? overrides.level : (sp.level ?? null);
    const pId = overrides.projectId !== undefined ? overrides.projectId : (projectId ?? null);
    const nId = overrides.numberId !== undefined ? overrides.numberId : (numberId ?? null);
    if (page > 1) next.set('page', String(page));
    if (level) next.set('level', level);
    if (pId) next.set('projectId', pId);
    if (nId) next.set('numberId', nId);
    const s = next.toString();
    return s ? `/logs?${s}` : '/logs';
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Logs</h1>
      <p className="mb-4 text-[var(--color-text-muted)]">
        Monitor events from workers and health checks (newest first).
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
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <span className="text-[var(--color-text-muted)]">Level:</span>
        <Link
          href={buildHref({ level: null, page: 1 })}
          className={
            !sp.level
              ? 'font-medium text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:underline'
          }
        >
          All
        </Link>
        {LEVELS.map((lvl) => (
          <Link
            key={lvl}
            href={buildHref({ level: lvl, page: 1 })}
            className={
              sp.level === lvl
                ? 'font-medium text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:underline'
            }
          >
            {lvl}
          </Link>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2">Event</th>
              <th className="px-4 py-2">Context</th>
              <th className="px-4 py-2">Error type</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                >
                  No log entries yet.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-t border-[var(--color-border)] align-top">
                  <td className="whitespace-nowrap px-4 py-2 text-[var(--color-text-muted)]">
                    {row.createdAt.toISOString()}
                  </td>
                  <td className="px-4 py-2 font-medium" style={{ color: levelColor(row.level) }}>
                    {row.level}
                  </td>
                  <td className="px-4 py-2">{row.event}</td>
                  <td className="max-w-xs px-4 py-2 text-[var(--color-text-muted)]">
                    {row.project && (
                      <Link
                        href={`/projects/${row.project.id}`}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        {row.project.name}
                      </Link>
                    )}
                    {row.project && row.number && ' · '}
                    {row.number && (
                      <Link
                        href={`/numbers/${row.number.id}`}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        {row.number.instanceName}
                      </Link>
                    )}
                    {!row.project && !row.number && '—'}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-text-muted)]">
                    {row.errorType ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
          <span>
            Page {meta.page} of {meta.totalPages} ({meta.total} entries)
          </span>
          <div className="flex gap-3">
            {meta.page > 1 && (
              <Link href={buildHref({ page: meta.page - 1 })} className="text-[var(--color-accent)] hover:underline">
                Previous
              </Link>
            )}
            {meta.page < meta.totalPages && (
              <Link href={buildHref({ page: meta.page + 1 })} className="text-[var(--color-accent)] hover:underline">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
