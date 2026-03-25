'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useT } from '@/components/i18n/i18n-provider';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';

export function DeleteNumberButton({
  numberId,
  instanceName,
  redirectAfter,
  compact,
}: {
  numberId: string;
  instanceName: string;
  /** If set, navigate here after successful delete (e.g. from number detail back to project). */
  redirectAfter?: string;
  /** Smaller control for table rows */
  compact?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onDelete() {
    setMsg(null);
    const ok = window.confirm(
      t(
        `Remover "${instanceName}" deste projeto?\n\nIsso apaga o registro do número e o histórico de health e alertas. A instância WhatsApp na Evolution não é excluída no servidor. Não é possível desfazer.`,
        `Remove "${instanceName}" from this project?\n\nThis deletes the number record and related health and alert history. Your Evolution instance on the server is not deleted. This cannot be undone.`,
      ),
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/numbers/${numberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(apiErrorMessage(data, t));
        return;
      }
      if (redirectAfter) {
        router.push(redirectAfter);
      }
      router.refresh();
    } catch {
      setMsg(t('Erro de rede', 'Network error'));
    } finally {
      setLoading(false);
    }
  }

  const btnClass = compact
    ? 'rounded border border-[var(--color-error)] bg-transparent px-2 py-1 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 disabled:opacity-60'
    : 'rounded-md border border-[var(--color-error)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 disabled:opacity-60';

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => void onDelete()}
        className={btnClass}
      >
        {loading ? t('Removendo…', 'Removing…') : t('Remover', 'Remove')}
      </button>
      {msg ? <p className="text-sm text-[var(--color-error)]">{msg}</p> : null}
    </div>
  );
}
