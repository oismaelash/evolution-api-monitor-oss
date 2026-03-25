'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useT } from '@/components/i18n/i18n-provider';

/**
 * Blocking modal until the user submits a display name (WhatsApp OTP signup without name).
 * No backdrop click, no close button — user must submit or sign out from the sidebar.
 */
export function WhatsAppDisplayNameModal() {
  const t = useT();
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('Informe seu nome.', 'Enter your name.'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: unknown };
        setError(
          typeof data.error === 'string'
            ? data.error
            : t('Não foi possível salvar.', 'Could not save.'),
        );
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="whatsapp-display-name-title"
    >
      <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
        <h2
          id="whatsapp-display-name-title"
          className="text-lg font-semibold text-[var(--color-text-primary)]"
        >
          {t('Qual é o seu nome?', 'What is your name?')}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {t(
            'Precisamos do seu nome para identificar você no painel. Este passo é obrigatório.',
            'We need your name to identify you in the app. This step is required.',
          )}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <label htmlFor="whatsapp-display-name-input" className="sr-only">
            {t('Nome', 'Name')}
          </label>
          <input
            id="whatsapp-display-name-input"
            type="text"
            name="displayName"
            autoComplete="name"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            placeholder={t('Seu nome completo ou como prefere ser chamado', 'Your full name or how you prefer to be called')}
            disabled={loading}
            autoFocus
          />
          {error ? (
            <p role="alert" className="text-sm text-[var(--color-error)]">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? t('A guardar…', 'Saving…') : t('Continuar', 'Continue')}
          </button>
        </form>
      </div>
    </div>
  );
}
