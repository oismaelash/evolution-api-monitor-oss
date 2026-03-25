'use client';

import useSWR from 'swr';
import { useT } from '@/components/i18n/i18n-provider';
import { formatNumberStateLabel } from '@/lib/number-state-label';
import { LocalDateTime } from '@/components/ui/local-datetime';

export type NumberDetailHeader = {
  instanceName: string;
  state: string;
  failureCount: number;
  project: { name: string };
};

type HealthCheckRow = {
  id: string;
  checkedAt: string;
  status: string;
  responseTimeMs: number | null;
};

type HealthChecksPayload = {
  data: HealthCheckRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

function pickHeader(n: unknown): NumberDetailHeader {
  const o = n as Record<string, unknown>;
  const p = (o.project as Record<string, unknown>) ?? {};
  return {
    instanceName: String(o.instanceName ?? ''),
    state: String(o.state ?? ''),
    failureCount: Number(o.failureCount ?? 0),
    project: { name: String(p.name ?? '') },
  };
}

async function fetchNumber(url: string): Promise<unknown> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch number');
  return res.json();
}

async function fetchHealthChecks(url: string): Promise<HealthChecksPayload> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch health checks');
  return res.json() as Promise<HealthChecksPayload>;
}

export function NumberDetailPolling({
  numberId,
  initialHeader,
  initialChecksPayload,
}: {
  numberId: string;
  initialHeader: NumberDetailHeader;
  initialChecksPayload: HealthChecksPayload;
}) {
  const t = useT();
  const numberUrl = `/api/numbers/${numberId}`;
  const checksUrl = `/api/numbers/${numberId}/health-checks?page=1&limit=20`;

  const { data: numberRaw } = useSWR(numberUrl, fetchNumber, {
    fallbackData: initialHeader as unknown,
    refreshInterval: 10_000,
  });

  const { data: checksPayload } = useSWR(checksUrl, fetchHealthChecks, {
    fallbackData: initialChecksPayload,
    refreshInterval: 10_000,
  });

  const header = pickHeader(numberRaw ?? initialHeader);
  const checks = checksPayload?.data ?? initialChecksPayload.data;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out space-y-8">
      {/* Header section with solid dark theme */}
      <div className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[#0b111e] p-6 shadow-2xl relative overflow-hidden">
        {/* subtle gradient glow behind text */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[var(--color-accent)] opacity-5 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{header.instanceName}</h1>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium shadow-sm backdrop-blur-md">
            {formatNumberStateLabel(header.state, t)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400 relative z-10">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
            {t('Projeto:', 'Project:')} <strong className="text-slate-200 font-medium ml-1">{header.project.name}</strong>
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-2 w-2 items-center justify-center rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"></span>
            {t('Falhas:', 'Failures:')} <strong className="text-slate-200 font-medium ml-1">{header.failureCount}</strong>
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-wide text-slate-200 flex items-center gap-2">
          {t('Health checks recentes', 'Recent health checks')}
        </h2>

        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[#0b111e] shadow-2xl">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-[#1e293b]/60 text-slate-400 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]/50">{t('Hora', 'Time')}</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]/50">{t('Status', 'Status')}</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]/50 text-right ms-auto">{t('ms', 'ms')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]/30">
              {checks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic font-mono">
                    {t('> Nenhum health check encontrado_', '> No health checks found_')}
                  </td>
                </tr>
              ) : (
                checks.map((c) => (
                  <tr key={c.id} className="group transition-all duration-200 hover:bg-white/[0.02] align-top">
                    <td className="whitespace-nowrap px-6 py-4 text-[11px] font-mono text-slate-500 group-hover:text-slate-300">
                      <LocalDateTime iso={c.checkedAt} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider border uppercase transition-all duration-300 ${
                        c.status.toUpperCase() === 'UP' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_12px_rgba(52,211,153,0.15)]' : 
                        c.status.toUpperCase() === 'DOWN' ? 'text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]' : 
                        'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          c.status.toUpperCase() === 'UP' ? 'bg-emerald-400' :
                          c.status.toUpperCase() === 'DOWN' ? 'bg-red-400' :
                          'bg-amber-400'
                        }`} />
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-[12px] text-slate-400 group-hover:text-slate-200 transition-colors">
                      {c.responseTimeMs !== null ? `${c.responseTimeMs}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
