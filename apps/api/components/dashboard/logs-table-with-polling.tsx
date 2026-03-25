'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { LocalDateTime } from '@/components/ui/local-datetime';
import { buildLogsHref } from '@/lib/logs-url';

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

type LogRow = {
  id: string;
  level: string;
  event: string;
  errorType: string | null;
  createdAt: string;
  project: { id: string; name: string } | null;
  number: { id: string; instanceName: string } | null;
};

type Meta = { page: number; limit: number; total: number; totalPages: number };

async function fetchLogs(url: string): Promise<{ data: LogRow[]; meta: Meta }> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json() as Promise<{ data: LogRow[]; meta: Meta }>;
}

export function LogsTableWithPolling({
  initialData,
  initialMeta,
  queryString,
  level,
  projectId,
  numberId,
}: {
  initialData: LogRow[];
  initialMeta: Meta;
  /** Mesma query que o server usou em `LogService.listGlobal` (ex.: `qs.toString()`). */
  queryString: string;
  level: string | undefined;
  projectId: string | undefined;
  numberId: string | undefined;
}) {
  const apiUrl = queryString ? `/api/logs?${queryString}` : '/api/logs';
  const { data } = useSWR(apiUrl, fetchLogs, {
    fallbackData: { data: initialData, meta: initialMeta },
    refreshInterval: 60_000,
    revalidateOnFocus: false,
    revalidateOnMount: false,
  });

  const rows = data?.data ?? initialData;
  const meta = data?.meta ?? initialMeta;

  const base = {
    page: meta.page,
    level: level ?? null,
    projectId: projectId ?? null,
    numberId: numberId ?? null,
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <span className="text-[var(--color-text-muted)]">Level:</span>
        <Link
          href={buildLogsHref(base, { level: null, page: 1 })}
          className={
            !level
              ? 'font-medium text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:underline'
          }
        >
          All
        </Link>
        {LEVELS.map((lvl) => (
          <Link
            key={lvl}
            href={buildLogsHref(base, { level: lvl, page: 1 })}
            className={
              level === lvl
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
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                >
                  No log entries yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--color-border)] align-top">
                  <td className="whitespace-nowrap px-4 py-2 text-[var(--color-text-muted)]">
                    <LocalDateTime iso={row.createdAt} />
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
              <Link
                href={buildLogsHref(base, { page: meta.page - 1 })}
                className="text-[var(--color-accent)] hover:underline"
              >
                Previous
              </Link>
            )}
            {meta.page < meta.totalPages && (
              <Link
                href={buildLogsHref(base, { page: meta.page + 1 })}
                className="text-[var(--color-accent)] hover:underline"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
