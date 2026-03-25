'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SyncInstancesButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/numbers/sync`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as { synced?: number; created?: number; error?: string };
      if (!res.ok) {
        setMsg(data.error ?? 'Sync failed');
        return;
      }
      setMsg(
        `Synced ${String(data.synced ?? 0)} instance(s), created ${String(data.created ?? 0)} new row(s).`
      );
      router.refresh();
    } catch {
      setMsg('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? 'Syncing…' : 'Sync instances'}
      </button>
      {msg ? <p className="text-sm text-[var(--color-text-muted)]">{msg}</p> : null}
    </div>
  );
}
