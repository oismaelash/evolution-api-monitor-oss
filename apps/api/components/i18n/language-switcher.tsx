'use client';

import { useRouter } from 'next/navigation';

import { MONITOR_LOCALE_COOKIE } from '@/lib/i18n';
import type { AppLocale } from '@/lib/i18n';

import { useLocale } from './i18n-provider';

function setLocaleCookie(locale: AppLocale): void {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${MONITOR_LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();

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
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => switchTo('pt')}
        className={
          locale === 'pt'
            ? 'font-semibold text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
        }
      >
        PT
      </button>
      <span className="mx-1.5 text-[var(--color-text-muted)]" aria-hidden>
        |
      </span>
      <button
        type="button"
        onClick={() => switchTo('en')}
        className={
          locale === 'en'
            ? 'font-semibold text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
        }
      >
        EN
      </button>
    </div>
  );
}
