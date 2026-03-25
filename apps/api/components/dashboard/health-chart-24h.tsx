'use client';

import { useT } from '@/components/i18n/i18n-provider';

type Bucket = { ts: number; ok: number; fail: number };

/**
 * Hour labels use the browser’s local timezone (see `ts` for each column).
 */
export function HealthChart24h({ buckets }: { buckets: Bucket[] }) {
  const t = useT();
  const max = Math.max(1, ...buckets.map((r) => r.ok + r.fail));

  return (
    <div className="group/chart relative mb-10 overflow-visible rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-accent/5 hover:z-[99999]">
      <div className="flex h-48 items-end gap-1 overflow-x-auto p-6 scrollbar-hide">
        {buckets.map((row, i) => {
          const hOk = (row.ok / max) * 100;
          const hFail = (row.fail / max) * 100;
          const date = new Date(row.ts);
          const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          
          return (
            <div 
              key={row.ts} 
              className="group relative flex min-w-[14px] flex-1 flex-col items-center gap-3 transition-all duration-300 ease-out hover:flex-[1.5]"
              style={{ transitionDelay: `${i * 5}ms` }}
            >
              <div className="flex w-full flex-1 flex-col justify-end gap-1">
                {/* OK Bar */}
                <div
                  className="relative w-full overflow-hidden rounded-t-sm transition-all duration-500 ease-out"
                  style={{ 
                    height: `${hOk}%`, 
                    minHeight: row.ok ? 4 : 0,
                    background: `linear-gradient(to top, var(--color-success), color-mix(in srgb, var(--color-success), white 30%))`,
                    opacity: row.ok ? 0.9 : 0.2,
                  }}
                >
                   <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Fail Bar */}
                <div
                  className="relative w-full overflow-hidden rounded-b-sm transition-all duration-500 ease-out"
                  style={{ 
                    height: `${hFail}%`, 
                    minHeight: row.fail ? 4 : 0,
                    background: `linear-gradient(to bottom, var(--color-error), color-mix(in srgb, var(--color-error), white 30%))`,
                    opacity: row.fail ? 0.9 : 0.2,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
              
              <span className="text-[10px] font-semibold text-[var(--color-text-muted)] opacity-50 group-hover:opacity-100 group-hover:text-[var(--color-text-primary)] transition-all duration-200">
                {label.split(':')[0]}h
              </span>

              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-4 w-36 -translate-x-1/2 scale-90 translate-y-2 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:translate-y-0 group-hover:opacity-100 z-[99999]">
                <div className="rounded-xl bg-white dark:bg-[#18181b] p-3 text-xs text-[var(--color-text-primary)] backdrop-blur-xl shadow-2xl border border-[var(--color-border)] ring-1 ring-black/5 dark:ring-white/10">
                  <div className="mb-2 border-b border-[var(--color-border)] pb-1 font-bold flex justify-between">
                    <span>{label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{t('Checks', 'Checks')}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center bg-[var(--color-bg)] rounded px-1.5 py-0.5">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)]" />
                        {t('Saudáveis', 'Healthy')}
                      </span>
                      <span className="font-mono font-bold text-[var(--color-success)]">{row.ok}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[var(--color-bg)] rounded px-1.5 py-0.5">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[var(--color-error)] shadow-[0_0_8px_var(--color-error)]" />
                        {t('Falhas', 'Failures')}</span>
                      <span className="font-mono font-bold text-[var(--color-error)]">{row.fail}</span>
                    </div>
                  </div>
                </div>
                {/* Arrow */}
                <div className="mx-auto -mt-1 h-2 w-2 rotate-45 border-r border-b border-[var(--color-border)] bg-white dark:bg-[#18181b]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
