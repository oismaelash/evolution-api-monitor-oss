'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { Danger, Warning2, InfoCircle, Command, LampCharge } from 'iconsax-react';
import { useT } from '@/components/i18n/i18n-provider';
import { LocalDateTime } from '@/components/ui/local-datetime';
import { buildLogsHref } from '@/lib/logs-url';

const LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG'] as const;

function LevelBadge({ level }: { level: string }) {
  let color = 'text-[var(--color-text-muted)] bg-[var(--color-border)]/30 border-[var(--color-border)]/50';
  let Icon = InfoCircle;

  switch (level) {
    case 'ERROR':
      color = 'text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20 shadow-[0_0_12px_var(--color-error-glow,rgba(239,68,68,0.15))]';
      Icon = Danger;
      break;
    case 'WARN':
      color = 'text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20 shadow-[0_0_12px_var(--color-warning-glow,rgba(245,158,11,0.15))]';
      Icon = Warning2;
      break;
    case 'INFO':
      color = 'text-[var(--color-accent)] bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20 shadow-[0_0_12px_var(--color-accent-glow)]';
      Icon = InfoCircle;
      break;
    case 'DEBUG':
      color = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      Icon = Command;
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider border ${color} uppercase transition-all duration-300`}>
      <Icon size={12} variant="Bold" />
      {level}
    </span>
  );
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
  queryString: string;
  level: string | undefined;
  projectId: string | undefined;
  numberId: string | undefined;
}) {
  const t = useT();
  const apiUrl = queryString ? `/api/logs?${queryString}` : '/api/logs';
  const { data } = useSWR(apiUrl, fetchLogs, {
    fallbackData: { data: initialData, meta: initialMeta },
    refreshInterval: 10_000,
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
      <div className="mb-6 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface)] px-3 py-1.5 border border-[var(--color-border)]">
          <LampCharge size={14} className="text-[var(--color-accent)]" />
          <span className="font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">{t('Níveis de Log', 'Log Levels')}</span>
        </div>
        <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-sm">
          <Link
            href={buildLogsHref(base, { level: null, page: 1 })}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
              !level
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)] shadow-lg shadow-accent/20'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-text-primary)]'
            }`}
          >
            {t('Todos', 'All')}
          </Link>
          {LEVELS.map((lvl) => (
            <Link
              key={lvl}
              href={buildLogsHref(base, { level: lvl, page: 1 })}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                level === lvl
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)] shadow-lg shadow-accent/20'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-text-primary)]'
              }`}
            >
              {lvl}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)] backdrop-blur-md">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]">{t('Hora', 'Time')}</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]">{t('Nível', 'Level')}</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]">{t('Evento', 'Event')}</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]">{t('Contexto', 'Context')}</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)] text-right">{t('Erro', 'Error')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]/50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic font-mono">
                  {t('> Nenhum registro encontrado_', '> No records found_')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr 
                  key={row.id} 
                  className={`group transition-all duration-200 hover:bg-[var(--color-border)]/30 align-top ${
                    row.level === 'ERROR' ? 'bg-[var(--color-error)]/5' : row.level === 'WARN' ? 'bg-[var(--color-warning)]/5' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-[11px] font-mono text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]">
                    <LocalDateTime iso={row.createdAt} />
                  </td>
                  <td className="px-6 py-4">
                    <LevelBadge level={row.level} />
                  </td>
                  <td className="px-6 py-4 font-mono text-[13px] leading-relaxed text-[var(--color-text-primary)] group-hover:text-[var(--color-text-primary)] break-all">
                    {row.event}
                  </td>
                  <td className="px-6 py-4 text-[12px]">
                    <div className="flex flex-col gap-1">
                      {row.project && (
                        <Link
                          href={`/projects/${row.project.id}`}
                          className="w-fit border-b border-dashed border-accent/30 text-[var(--color-accent)] hover:border-accent hover:text-[var(--color-text-primary)] transition-all"
                        >
                          {row.project.name}
                        </Link>
                      )}
                      {row.number && (
                        <Link
                          href={`/numbers/${row.number.id}`}
                          className="w-fit text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
                        >
                          {row.number.instanceName}
                        </Link>
                      )}
                      {!row.project && !row.number && <span className="text-[var(--color-text-muted)]">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {row.errorType ? (
                      <span className="rounded bg-[var(--color-error)]/10 px-2 py-0.5 font-mono text-[11px] text-[var(--color-error)] border border-[var(--color-error)]/20">
                        {row.errorType}
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          <div className="flex items-center gap-4">
            <span className="bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg shadow-sm">
              {t('Página', 'Page')} {meta.page} / {meta.totalPages}
            </span>
            <span className="text-[var(--color-text-muted)]">
              {meta.total} {t('Registros', 'Records')}
            </span>
          </div>
          <div className="flex gap-2">
            {meta.page > 1 ? (
              <Link
                href={buildLogsHref(base, { page: meta.page - 1 })}
                className="rounded-lg bg-[var(--color-surface)] px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/50 transition-all shadow-sm"
              >
                {t('Anterior', 'Previous')}
              </Link>
            ) : (
              <span className="rounded-lg bg-[var(--color-surface)] px-4 py-2 border border-[var(--color-border)]/50 text-[var(--color-text-muted)] opacity-50 cursor-not-allowed">
                {t('Anterior', 'Previous')}
              </span>
            )}

            {meta.page < meta.totalPages ? (
              <Link
                href={buildLogsHref(base, { page: meta.page + 1 })}
                className="rounded-lg bg-[var(--color-surface)] px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/50 transition-all shadow-sm"
              >
                {t('Próxima', 'Next')}
              </Link>
            ) : (
              <span className="rounded-lg bg-[var(--color-surface)] px-4 py-2 border border-[var(--color-border)]/50 text-[var(--color-text-muted)] opacity-50 cursor-not-allowed">
                {t('Próxima', 'Next')}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
