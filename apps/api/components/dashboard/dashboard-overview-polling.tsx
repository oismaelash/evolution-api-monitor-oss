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
    refreshInterval: 60_000,
    revalidateOnFocus: false,
    revalidateOnMount: false,
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
      <div className="mb-10 overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-2">{t('Instância', 'Instance')}</th>
              <th className="px-4 py-2">{t('Uptime', 'Uptime')}</th>
            </tr>
          </thead>
          <tbody>
            {p.uptimeRows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-[var(--color-text-muted)]" colSpan={2}>
                  {t('Nenhum número ainda.', 'No numbers yet.')}
                </td>
              </tr>
            ) : (
              p.uptimeRows.map((u) => (
                <tr key={u.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-2">
                    <Link href={`/numbers/${u.id}`} className="text-[var(--color-accent)] hover:underline">
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 max-w-xs overflow-hidden rounded-full bg-[var(--color-border)]">
                        <div
                          className="h-full bg-[var(--color-success)]"
                          style={{ width: `${u.pct}%` }}
                        />
                      </div>
                      <span className="text-[var(--color-text-muted)]">{u.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))
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
