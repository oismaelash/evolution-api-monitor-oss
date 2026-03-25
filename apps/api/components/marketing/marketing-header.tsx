import Link from 'next/link';

import { Cloud, Code } from 'iconsax-react';

import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { getServerTranslator } from '@/lib/i18n-server';

const DASHBOARD_HREF = '/dashboard';

export async function MarketingHeader() {
  const t = await getServerTranslator();

  return (
    <header className="border-b border-[var(--color-border)] py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
          Evolution API Monitor
        </Link>
        <LanguageSwitcher className="shrink-0" />
      </div>
      <nav
        className="flex flex-wrap items-center gap-6 text-sm text-[var(--color-text-muted)]"
        aria-label={t('Principal', 'Primary')}
      >
        <a href="#features" className="transition-colors hover:text-[var(--color-text-primary)]">
          {t('Recursos', 'Features')}
        </a>
        <a href="#open-source" className="transition-colors hover:text-[var(--color-text-primary)]">
          {t('Open source', 'Open source')}
        </a>
        <Link
          href={DASHBOARD_HREF}
          className="inline-flex items-center gap-1.5 font-medium text-[var(--color-accent)] transition-opacity hover:opacity-90"
        >
          <Cloud size={18} variant="Bold" color="currentColor" aria-hidden />
          {t('Cloud', 'Cloud')}
        </Link>
        <Link
          href={DASHBOARD_HREF}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {t('Começar', 'Get started')}
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--color-text-primary)]"
        >
          <Code size={18} variant="Linear" color="currentColor" aria-hidden />
          GitHub
        </a>
      </nav>
    </header>
  );
}
