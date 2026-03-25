'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';

type PreviewRow = { instanceName: string; alreadyInProject: boolean };

export function SyncInstancesButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  /** Instance names the user wants to add (subset of rows where !alreadyInProject). */
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());

  const openModal = useCallback(async () => {
    setMsg(null);
    setOpen(true);
    setPreviewError(null);
    setRows([]);
    setSelectedToAdd(new Set());
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/numbers/sync`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as {
        instances?: PreviewRow[];
        error?: unknown;
      };
      if (!res.ok) {
        setPreviewError(apiErrorMessage(data));
        return;
      }
      const list = Array.isArray(data.instances) ? data.instances : [];
      setRows(list);
      setSelectedToAdd(
        new Set(list.filter((r) => !r.alreadyInProject).map((r) => r.instanceName)),
      );
    } catch {
      setPreviewError('Network error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const closeModal = useCallback(() => {
    setOpen(false);
    setPreviewError(null);
    setRows([]);
    setSelectedToAdd(new Set());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeModal]);

  function toggle(name: string, checked: boolean) {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (checked) next.add(name);
      else next.delete(name);
      return next;
    });
  }

  async function confirmAdd() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/numbers/sync`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceNames: [...selectedToAdd] }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        synced?: number;
        created?: number;
        error?: unknown;
      };
      if (!res.ok) {
        setMsg(apiErrorMessage(data));
        return;
      }
      setMsg(
        `Synced ${String(data.synced ?? 0)} instance(s) from Evolution; created ${String(data.created ?? 0)} new row(s).`,
      );
      closeModal();
      router.refresh();
    } catch {
      setMsg('Network error');
    } finally {
      setLoading(false);
    }
  }

  const newCount = rows.filter((r) => !r.alreadyInProject).length;
  const selectedCount = [...selectedToAdd].filter((name) =>
    rows.some((r) => r.instanceName === name && !r.alreadyInProject),
  ).length;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void openModal()}
        disabled={loading && !open}
        className="w-fit rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading && !open ? 'Loading…' : 'Sync instances'}
      </button>
      {msg ? <p className="text-sm text-[var(--color-text-muted)]">{msg}</p> : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sync-instances-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close"
            onClick={() => !loading && closeModal()}
          />
          <div className="relative z-10 max-h-[min(85vh,560px)] w-full max-w-lg overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl">
            <div className="border-b border-[var(--color-border)] px-4 py-3">
              <h2 id="sync-instances-title" className="text-base font-semibold text-[var(--color-text-primary)]">
                Choose instances to add
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Instances already in this project are shown for reference. Select which new names to
                register.
              </p>
            </div>
            <div className="max-h-[min(50vh,360px)] overflow-y-auto px-4 py-3">
              {loading ? (
                <p className="text-sm text-[var(--color-text-muted)]">Loading from Evolution…</p>
              ) : previewError ? (
                <p className="text-sm text-[var(--color-error)]">{previewError}</p>
              ) : rows.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No instances returned from Evolution. Check your URL and API key in Connection
                  settings.
                </p>
              ) : (
                <ul className="space-y-2">
                  {rows.map((row, idx) => {
                    const disabled = row.alreadyInProject;
                    const checked = disabled ? false : selectedToAdd.has(row.instanceName);
                    const inputId = `sync-instance-${idx}`;
                    return (
                      <li
                        key={row.instanceName}
                        className={`flex items-start gap-3 rounded-md border border-[var(--color-border)] px-3 py-2 ${
                          disabled ? 'opacity-70' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={inputId}
                          className="mt-0.5 shrink-0"
                          disabled={disabled || loading}
                          checked={checked}
                          onChange={(e) => toggle(row.instanceName, e.target.checked)}
                        />
                        <label
                          htmlFor={inputId}
                          className="min-w-0 flex-1 cursor-pointer text-sm"
                        >
                          <span className="break-all font-mono text-[var(--color-text-primary)]">
                            {row.instanceName}
                          </span>
                          {row.alreadyInProject ? (
                            <span className="ml-2 text-[var(--color-text-muted)]">
                              (already in project)
                            </span>
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => closeModal()}
                className="rounded-md border border-[var(--color-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !!previewError || rows.length === 0 || newCount === 0}
                onClick={() => void confirmAdd()}
                className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading
                  ? 'Saving…'
                  : newCount === 0
                    ? 'Nothing new to add'
                    : `Add selected (${selectedCount})`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
