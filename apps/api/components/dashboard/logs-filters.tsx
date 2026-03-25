'use client';

import { ArrowDown2 } from 'iconsax-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useT } from '@/components/i18n/i18n-provider';

export type LogsFilterProject = {
  id: string;
  name: string;
  numbers: { id: string; instanceName: string }[];
};

const selectClassName =
  'w-full cursor-pointer appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pl-3 pr-10 text-sm text-[var(--color-text-primary)] shadow-sm transition-[border-color,box-shadow] hover:border-[var(--color-accent)]/35 hover:shadow focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/25';

function LogFilterSelect({
  id,
  label,
  children,
  ...selectProps
}: {
  id: string;
  label: string;
} & Omit<React.ComponentProps<'select'>, 'className' | 'id'>) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]"
      >
        {label}
      </label>
      <div className="relative min-w-0">
        <select
          id={id}
          className={selectClassName}
          {...selectProps}
        >
          {children}
        </select>
        <ArrowDown2
          size={18}
          variant="Linear"
          color="var(--color-text-muted)"
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
          aria-hidden
        />
      </div>
    </div>
  );
}

export function LogsFilters({
  projects,
  currentProjectId,
  currentNumberId,
}: {
  projects: LogsFilterProject[];
  currentProjectId?: string;
  currentNumberId?: string;
}) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateWithParams = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete('page');
      mutate(next);
      const s = next.toString();
      router.push(s ? `/logs?${s}` : '/logs');
    },
    [router, searchParams]
  );

  const numberOptions = useMemo(() => {
    if (currentProjectId) {
      const p = projects.find((x) => x.id === currentProjectId);
      return (p?.numbers ?? []).map((n) => ({
        id: n.id,
        label: n.instanceName,
      }));
    }
    return projects.flatMap((p) =>
      p.numbers.map((n) => ({
        id: n.id,
        label: `${n.instanceName} (${p.name})`,
      }))
    );
  }, [projects, currentProjectId]);

  const onProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    navigateWithParams((next) => {
      if (value) {
        next.set('projectId', value);
      } else {
        next.delete('projectId');
      }
      const nums = value
        ? projects.find((p) => p.id === value)?.numbers ?? []
        : projects.flatMap((p) => p.numbers);
      const stillValid = currentNumberId && nums.some((n) => n.id === currentNumberId);
      if (!stillValid) {
        next.delete('numberId');
      }
    });
  };

  const onNumberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    navigateWithParams((next) => {
      if (value) {
        next.set('numberId', value);
      } else {
        next.delete('numberId');
      }
    });
  };

  const onClearScope = () => {
    navigateWithParams((next) => {
      next.delete('projectId');
      next.delete('numberId');
    });
  };

  const hasScope = Boolean(currentProjectId || currentNumberId);

  return (
    <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4 text-sm">
        <div className="min-w-[10rem] max-w-full flex-1 sm:max-w-xs">
          <LogFilterSelect
            id="logs-filter-project"
            label={t('Projeto', 'Project')}
            value={currentProjectId ?? ''}
            onChange={onProjectChange}
          >
            <option value="">{t('Todos os projetos', 'All projects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </LogFilterSelect>
        </div>
        <div className="min-w-[12rem] max-w-full flex-1 sm:max-w-md">
          <LogFilterSelect
            id="logs-filter-number"
            label={t('Número', 'Number')}
            value={currentNumberId ?? ''}
            onChange={onNumberChange}
          >
            <option value="">{t('Todos os números', 'All numbers')}</option>
            {numberOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </LogFilterSelect>
        </div>
        {hasScope && (
          <button
            type="button"
            onClick={onClearScope}
            className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-[var(--color-text-muted)] shadow-sm transition-[border-color,background-color,color] hover:border-[var(--color-accent)]/35 hover:text-[var(--color-text-primary)]"
          >
            {t('Limpar escopo', 'Clear scope')}
          </button>
        )}
      </div>
    </div>
  );
}
