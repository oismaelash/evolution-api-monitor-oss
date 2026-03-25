'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useT } from '@/components/i18n/i18n-provider';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';

import { Trash } from 'iconsax-react';

export function DeleteProjectButton({
  projectId,
  projectName,
  numberCount,
}: {
  projectId: string;
  projectName: string;
  numberCount: number;
}) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onDelete() {
    setMsg(null);
    const numbersLine =
      numberCount === 0
        ? t(
            'Todos os números deste projeto serão removidos (nenhum registrado).',
            'All numbers under this project will be removed (none registered).',
          )
        : numberCount === 1
          ? t(
              'O 1 número registrado será excluído permanentemente.',
              'The 1 registered number will be permanently deleted.',
            )
          : t(
              `Todos os ${numberCount} números registrados serão excluídos permanentemente.`,
              `All ${numberCount} registered numbers will be permanently deleted.`,
            );
    const ok = window.confirm(
      t(
        `Excluir projeto "${projectName}"?\n\n${numbersLine} Os agendamentos de health serão limpos. Não é possível desfazer.`,
        `Delete project "${projectName}"?\n\n${numbersLine} Health schedules will be cleared. This cannot be undone.`,
      ),
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(apiErrorMessage(data, t));
        return;
      }
      router.push('/projects');
      router.refresh();
    } catch {
      setMsg(t('Erro de rede', 'Network error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={loading}
        onClick={() => void onDelete()}
        className="flex items-center gap-2 rounded-md border border-[var(--color-error)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10 disabled:opacity-60"
      >
        <Trash size="18" variant="Outline" />
        {loading ? t('Excluindo…', 'Deleting…') : t('Excluir projeto', 'Delete project')}
      </button>
      {msg ? <p className="text-sm text-[var(--color-error)]">{msg}</p> : null}
    </div>
  );
}
