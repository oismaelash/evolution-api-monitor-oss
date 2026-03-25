'use client';

import { useState } from 'react';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';
import { useT } from '@/components/i18n/i18n-provider';

export function BillingActions({ billingEnabled }: { billingEnabled: boolean }) {
  const t = useT();
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function checkout() {
    setLoading('checkout');
    setErr(null);
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setErr(apiErrorMessage(data, t));
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setErr(t('Sem URL de checkout', 'No checkout URL'));
    } finally {
      setLoading(null);
    }
  }

  async function portal() {
    setLoading('portal');
    setErr(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setErr(apiErrorMessage(data, t));
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setErr(t('Sem URL do portal', 'No portal URL'));
    } finally {
      setLoading(null);
    }
  }

  if (!billingEnabled) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => void checkout()}
        disabled={loading !== null}
        className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-text)] disabled:opacity-60"
      >
        {loading === 'checkout'
          ? t('Redirecionando…', 'Redirecting…')
          : t('Abrir checkout (Stripe)', 'Open checkout (Stripe)')}
      </button>
      <button
        type="button"
        onClick={() => void portal()}
        disabled={loading !== null}
        className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] disabled:opacity-60"
      >
        {loading === 'portal'
          ? t('Redirecionando…', 'Redirecting…')
          : t('Portal de cobrança', 'Billing portal')}
      </button>
      {err ? <p className="w-full text-sm text-[var(--color-error)]">{err}</p> : null}
    </div>
  );
}
