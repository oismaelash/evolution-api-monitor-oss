'use client';

import { useState } from 'react';

import { useT } from '@/components/i18n/i18n-provider';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';

type Mode = 'env' | 'setup' | 'login';

export function AccessGateForm({
  mode,
  showConfigError,
  nextPath,
}: {
  mode: Mode;
  showConfigError: boolean;
  nextPath: string;
}) {
  const t = useT();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmitSetup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/access/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword: confirm }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: unknown };
      if (!res.ok) {
        const msg =
          typeof data.error === 'string'
            ? data.error
            : t('Não foi possível salvar a senha.', 'Could not save password.');
        setError(msg);
        return;
      }
      window.location.assign(nextPath);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/access/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      if (!res.ok) {
        setError(
          data.error ??
            t('Senha incorreta.', 'Invalid password.'),
        );
        return;
      }
      window.location.assign(nextPath);
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === 'setup'
      ? t('Definir senha de acesso', 'Set access password')
      : mode === 'env'
        ? t('Senha de acesso (configuração)', 'Access password (from configuration)')
        : t('Entrar', 'Sign in');

  const description =
    mode === 'setup'
      ? t(
          'Esta senha protege o painel. Guarde-a com segurança.',
          'This password protects the dashboard. Store it safely.',
        )
      : mode === 'env'
        ? t(
            'Digite a mesma senha definida em OSS_ACCESS_PASSWORD no ambiente.',
            'Enter the same value as OSS_ACCESS_PASSWORD in your environment.',
          )
        : t('Digite a senha de acesso do painel.', 'Enter your dashboard access password.');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{description}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {showConfigError ? (
        <div
          className="rounded-lg border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]"
          role="alert"
        >
          {t(
            'APP_ACCESS_LOCK está ativo, mas faltam ENCRYPTION_KEY (64 caracteres hex) ou NEXTAUTH_SECRET (32+ caracteres) no ambiente. Defina um deles e reinicie.',
            'APP_ACCESS_LOCK is on, but ENCRYPTION_KEY (64 hex chars) or NEXTAUTH_SECRET (32+ chars) is missing. Set one and restart.',
          )}
        </div>
      ) : null}

      {error ? (
        <div
          className="rounded-lg border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {mode === 'setup' ? (
        <form onSubmit={onSubmitSetup} className="space-y-4">
          <div>
            <label htmlFor="pw" className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">
              {t('Senha', 'Password')}
            </label>
            <input
              id="pw"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              required
              minLength={8}
            />
          </div>
          <div>
            <label htmlFor="pw2" className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">
              {t('Confirmar senha', 'Confirm password')}
            </label>
            <input
              id="pw2"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(ev) => setConfirm(ev.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={loading || showConfigError}
            className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-accent-text)] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t('Salvando…', 'Saving…') : t('Salvar e entrar', 'Save and continue')}
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmitVerify} className="space-y-4">
          <div>
            <label htmlFor="pwo" className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">
              {t('Senha', 'Password')}
            </label>
            <input
              id="pwo"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || showConfigError}
            className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-accent-text)] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t('Entrando…', 'Signing in…') : t('Entrar', 'Sign in')}
          </button>
        </form>
      )}
    </div>
  );
}
