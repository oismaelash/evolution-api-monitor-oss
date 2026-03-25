'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useT } from '@/components/i18n/i18n-provider';
import type { DashboardOverviewPayload } from '@/lib/dashboard-overview-types';
import { HealthChart24h } from '@/components/dashboard/health-chart-24h';
import { LocalDateTime } from '@/components/ui/local-datetime';

async function fetchOverview(url: string): Promise<DashboardOverviewPayload> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json() as Promise<DashboardOverviewPayload>;
}

export function DashboardOverviewPolling({
  initialData,
}: {
  initialData: DashboardOverviewPayload;
}) {
  const t = useT();
  const { data } = useSWR('/api/dashboard/overview', fetchOverview, {
    fallbackData: initialData,
    refreshInterval: 30_000,
  });

  const p = data ?? initialData;

  return (
    <>
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-sm text-[var(--color-text-muted)]">
            {t('Total de números', 'Total numbers')}
          </div>
          <div className="text-2xl font-semibold">{p.stats.total}</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-sm text-[var(--color-text-muted)]">
            {t('Conectados', 'Connected')}
          </div>
          <div className="text-2xl font-semibold text-[var(--color-success)]">{p.stats.connected}</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-sm text-[var(--color-text-muted)]">
            {t('Com erro', 'In error')}
          </div>
          <div className="text-2xl font-semibold text-[var(--color-error)]">{p.stats.errors}</div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-medium">
        {t('Health checks (24h)', 'Health checks (24h)')}
      </h2>
      <HealthChart24h buckets={p.chartBuckets} />

      <h2 className="mb-4 text-lg font-medium">
        {t('Uptime (24h) por número', 'Uptime (24h) by number')}
      </h2>
      <div className="mb-10 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead className="bg-white/[0.02] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">{t('Instância', 'Instance')}</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px] text-right">{t('Uptime (24h)', 'Uptime (24h)')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {p.uptimeRows.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-[var(--color-text-muted)] italic" colSpan={2}>
                  {t('Nenhum número monitorado ainda.', 'No numbers monitored yet.')}
                </td>
              </tr>
            ) : (
              p.uptimeRows.map((u) => {
                const isHealthy = u.pct >= 99;
                const isWarning = u.pct < 99 && u.pct >= 95;
                const colorClass = isHealthy ? 'text-[var(--color-success)]' : isWarning ? 'text-[var(--color-warning)]' : 'text-[var(--color-error)]';
                const dotColorClass = isHealthy ? 'bg-[var(--color-success)]' : isWarning ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-error)]';
                const bgColorClass = isHealthy ? 'from-[var(--color-success)]' : isWarning ? 'from-[var(--color-warning)]' : 'from-[var(--color-error)]';
                
                return (
                  <tr key={u.id} className="group transition-colors duration-200 hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full shadow-[0_0_8px_currentColor] ${dotColorClass} ${colorClass}`} />
                        <Link href={`/numbers/${u.id}`} className="font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent)]">
                          {u.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto flex max-w-[280px] items-center gap-4">
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)] shadow-inner">
                          {/* Progress bar with gradient */}
                          <div
                            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${bgColorClass} to-white/30 transition-all duration-1000 ease-out`}
                            style={{ width: `${u.pct}%` }}
                          />
                          {/* Shine effect on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </div>
                        <span className={`min-w-[48px] text-right font-mono font-bold ${colorClass}`}>
                          {u.pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-4 text-lg font-medium">{t('Alertas recentes', 'Recent alerts')}</h2>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-2">{t('Quando', 'When')}</th>
              <th className="px-4 py-2">{t('Instância', 'Instance')}</th>
              <th className="px-4 py-2">{t('Canal', 'Channel')}</th>
            </tr>
          </thead>
          <tbody>
            {p.recentAlerts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-[var(--color-text-muted)]" colSpan={3}>
                  {t('Nenhum alerta ainda.', 'No alerts yet.')}
                </td>
              </tr>
            ) : (
              p.recentAlerts.map((a) => (
                <tr key={a.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-2">
                    <LocalDateTime iso={a.sentAt} />
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/numbers/${a.numberId}`}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      {a.instanceName}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{a.channel}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
