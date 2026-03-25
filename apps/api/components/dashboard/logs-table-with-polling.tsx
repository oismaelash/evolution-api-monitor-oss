'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { Danger, Warning2, InfoCircle, Command, LampCharge } from 'iconsax-react';
import { useT } from '@/components/i18n/i18n-provider';
import { LocalDateTime } from '@/components/ui/local-datetime';
import { buildLogsHref } from '@/lib/logs-url';

const LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG'] as const;

function LevelBadge({ level }: { level: string }) {
  let color = 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  let Icon = InfoCircle;

  switch (level) {
    case 'ERROR':
      color = 'text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]';
      Icon = Danger;
      break;
    case 'WARN':
      color = 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]';
      Icon = Warning2;
      break;
    case 'INFO':
      color = 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20 shadow-[0_0_12px_rgba(99,102,241,0.15)]';
      Icon = InfoCircle;
      break;
    case 'DEBUG':
      color = 'text-blue-400 bg-blue-400/10 border-blue-400/20';
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
          <span className="font-semibold uppercase tracking-widest text-slate-400">{t('Níveis de Log', 'Log Levels')}</span>
        </div>
        <div className="flex gap-1">
          <Link
            href={buildLogsHref(base, { level: null, page: 1 })}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
              !level
                ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-accent/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
                  ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-accent/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {lvl}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[#0b111e] shadow-2xl">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead className="bg-[#1e293b]/60 text-slate-400 backdrop-blur-md">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]/50">{t('Hora', 'Time')}</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]/50">{t('Nível', 'Level')}</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]/50">{t('Evento', 'Event')}</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]/50">{t('Contexto', 'Context')}</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]/50 text-right">{t('Erro', 'Error')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]/30">
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
                  className={`group transition-all duration-200 hover:bg-white/[0.02] align-top ${
                    row.level === 'ERROR' ? 'bg-red-500/[0.03]' : row.level === 'WARN' ? 'bg-amber-500/[0.02]' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-[11px] font-mono text-slate-500 group-hover:text-slate-300">
                    <LocalDateTime iso={row.createdAt} />
                  </td>
                  <td className="px-6 py-4">
                    <LevelBadge level={row.level} />
                  </td>
                  <td className="px-6 py-4 font-mono text-[13px] leading-relaxed text-slate-200 group-hover:text-white break-all">
                    {row.event}
                  </td>
                  <td className="px-6 py-4 text-[12px]">
                    <div className="flex flex-col gap-1">
                      {row.project && (
                        <Link
                          href={`/projects/${row.project.id}`}
                          className="w-fit border-b border-dashed border-accent/30 text-[var(--color-accent)] hover:border-accent hover:text-white transition-all"
                        >
                          {row.project.name}
                        </Link>
                      )}
                      {row.number && (
                        <Link
                          href={`/numbers/${row.number.id}`}
                          className="w-fit text-[11px] text-slate-400 hover:text-white transition-all"
                        >
                          {row.number.instanceName}
                        </Link>
                      )}
                      {!row.project && !row.number && <span className="text-slate-600">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {row.errorType ? (
                      <span className="rounded bg-red-400/10 px-2 py-0.5 font-mono text-[11px] text-red-300 border border-red-400/20">
                        {row.errorType}
                      </span>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <div className="flex items-center gap-4">
             <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
               {t('Página', 'Page')} {meta.page} / {meta.totalPages}
             </span>
             <span className="text-slate-600">
               {meta.total} {t('Registros', 'Records')}
             </span>
          </div>
          <div className="flex gap-2">
            {meta.page > 1 && (
              <Link
                href={buildLogsHref(base, { page: meta.page - 1 })}
                className="rounded-lg bg-[var(--color-surface)] px-4 py-2 border border-[var(--color-border)] text-slate-300 hover:bg-white/5 hover:text-white transition-all shadow-sm"
              >
                {t('Anterior', 'Previous')}
              </Link>
            )}
            {meta.page < meta.totalPages && (
              <Link
                href={buildLogsHref(base, { page: meta.page + 1 })}
                className="rounded-lg bg-[var(--color-surface)] px-4 py-2 border border-[var(--color-border)] text-slate-300 hover:bg-white/5 hover:text-white transition-all shadow-sm"
              >
                {t('Próxima', 'Next')}
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
