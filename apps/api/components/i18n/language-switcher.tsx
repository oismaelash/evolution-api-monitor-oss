'use client';

import { useRouter } from 'next/navigation';

import { useLocale, useT } from '@/components/i18n/i18n-provider';
import { MONITOR_LOCALE_COOKIE } from '@/lib/i18n';
import type { AppLocale } from '@/lib/i18n';

function setLocaleCookie(locale: AppLocale): void {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${MONITOR_LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

const btnBase =
  'min-w-[2.25rem] rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]';

export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useT();

  function switchTo(next: AppLocale) {
    if (next === locale) {
      return;
    }
    setLocaleCookie(next);
    router.refresh();
  }

  return (
    <div
      className={className}
      role="group"
      aria-label={t('Idioma', 'Language')}
    >
      <div className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5 shadow-sm">
        <button
          type="button"
          onClick={() => switchTo('pt')}
          className={`${btnBase} ${
            locale === 'pt'
              ? 'bg-[var(--color-border)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-text-primary)]'
          }`}
        >
          PT
        </button>
        <button
          type="button"
          onClick={() => switchTo('en')}
          className={`${btnBase} ${
            locale === 'en'
              ? 'bg-[var(--color-border)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-text-primary)]'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
