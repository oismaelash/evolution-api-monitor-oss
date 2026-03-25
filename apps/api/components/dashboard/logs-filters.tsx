'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useT } from '@/components/i18n/i18n-provider';

export type LogsFilterProject = {
  id: string;
  name: string;
  numbers: { id: string; instanceName: string }[];
};

const selectClassName =
  'min-w-[10rem] max-w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text-primary)]';

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
    <div className="mb-4 flex flex-wrap items-end gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-[var(--color-text-muted)]">{t('Projeto', 'Project')}</span>
        <select
          className={selectClassName}
          value={currentProjectId ?? ''}
          onChange={onProjectChange}
          aria-label={t('Filtrar por projeto', 'Filter by project')}
        >
          <option value="">{t('Todos os projetos', 'All projects')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1">
        <span className="text-[var(--color-text-muted)]">{t('Número', 'Number')}</span>
        <select
          className={`${selectClassName} min-w-[12rem]`}
          value={currentNumberId ?? ''}
          onChange={onNumberChange}
          aria-label={t('Filtrar por número', 'Filter by number')}
        >
          <option value="">{t('Todos os números', 'All numbers')}</option>
          {numberOptions.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
      </label>
      {hasScope && (
        <button
          type="button"
          onClick={onClearScope}
          className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/40"
        >
          {t('Limpar escopo', 'Clear scope')}
        </button>
      )}
    </div>
  );
}
