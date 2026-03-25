'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';

export function DeleteProjectButton({
  projectId,
  projectName,
  numberCount,
}: {
  projectId: string;
  projectName: string;
  numberCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onDelete() {
    setMsg(null);
    const numbersLine =
      numberCount === 0
        ? 'All numbers under this project will be removed (none registered).'
        : numberCount === 1
          ? 'The 1 registered number will be permanently deleted.'
          : `All ${numberCount} registered numbers will be permanently deleted.`;
    const ok = window.confirm(
      `Delete project "${projectName}"?\n\n${numbersLine} Health schedules will be cleared. This cannot be undone.`,
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
        setMsg(apiErrorMessage(data));
        return;
      }
      router.push('/projects');
      router.refresh();
    } catch {
      setMsg('Network error');
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
        className="rounded-md border border-[var(--color-error)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 disabled:opacity-60"
      >
        {loading ? 'Deleting…' : 'Delete project'}
      </button>
      {msg ? <p className="text-sm text-[var(--color-error)]">{msg}</p> : null}
    </div>
  );
}
