'use client';

type Bucket = { ts: number; ok: number; fail: number };

/**
 * Hour labels use the browser’s local timezone (see `ts` for each column).
 */
export function HealthChart24h({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((r) => r.ok + r.fail));
  return (
    <div className="mb-10 flex h-40 items-end gap-0.5 overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {buckets.map((row) => {
        const hOk = (row.ok / max) * 100;
        const hFail = (row.fail / max) * 100;
        const label = `${new Date(row.ts).getHours().toString().padStart(2, '0')}h`;
        return (
          <div key={row.ts} className="flex min-w-[10px] flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 flex-col justify-end gap-px">
              <div
                className="w-full rounded-sm bg-[var(--color-success)]"
                style={{ height: `${hOk}%`, minHeight: row.ok ? 2 : 0 }}
                title={`${row.ok} healthy`}
              />
              <div
                className="w-full rounded-sm bg-[var(--color-error)]"
                style={{ height: `${hFail}%`, minHeight: row.fail ? 2 : 0 }}
                title={`${row.fail} unhealthy`}
              />
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
