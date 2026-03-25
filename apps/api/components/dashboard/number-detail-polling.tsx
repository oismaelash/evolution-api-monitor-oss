'use client';

import useSWR from 'swr';
import { useT } from '@/components/i18n/i18n-provider';
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
    refreshInterval: 60_000,
    revalidateOnFocus: false,
    revalidateOnMount: false,
  });

  const { data: checksPayload } = useSWR(checksUrl, fetchHealthChecks, {
    fallbackData: initialChecksPayload,
    refreshInterval: 60_000,
    revalidateOnFocus: false,
    revalidateOnMount: false,
  });

  const header = pickHeader(numberRaw ?? initialHeader);
  const checks = checksPayload?.data ?? initialChecksPayload.data;

  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">{header.instanceName}</h1>
      <p className="mb-2 text-sm text-[var(--color-text-muted)]">
        {t('Projeto:', 'Project:')} {header.project.name} · {t('Estado:', 'State:')}{' '}
        <span className="text-[var(--color-text-primary)]">{header.state}</span>
      </p>
      <p className="mb-8 text-sm text-[var(--color-text-muted)]">
        {t('Contagem de falhas:', 'Failure count:')} {header.failureCount}
      </p>
      <h2 className="mb-4 text-lg font-medium">
        {t('Health checks recentes', 'Recent health checks')}
      </h2>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-2">{t('Hora', 'Time')}</th>
              <th className="px-4 py-2">{t('Status', 'Status')}</th>
              <th className="px-4 py-2">ms</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c.id} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-2">
                  <LocalDateTime iso={c.checkedAt} />
                </td>
                <td className="px-4 py-2">{c.status}</td>
                <td className="px-4 py-2">{c.responseTimeMs ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
