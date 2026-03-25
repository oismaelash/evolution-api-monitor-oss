'use client';

import { useT } from '@/components/i18n/i18n-provider';

export function LoginLoadingFallback() {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-text-muted)]">
      {t('Carregando…', 'Loading…')}
    </div>
  );
}
