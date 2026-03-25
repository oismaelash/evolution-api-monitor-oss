import Link from 'next/link';

import { Cloud, Code, Monitor } from 'iconsax-react';

import { loadEnv } from '@monitor/shared';

import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { getServerTranslator } from '@/lib/i18n-server';

const DASHBOARD_HREF = '/dashboard';

export async function MarketingHeader() {
  const t = await getServerTranslator();
  const openSourceRepoUrl = loadEnv().OPEN_SOURCE_REPO_URL;

  return (
    <header className="sticky top-0 z-50 flex flex-col gap-4 py-4 transition-all">
      <div className="flex items-center justify-between gap-4 glass rounded-2xl px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-[var(--color-text-primary)] hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shadow-lg shadow-accent/20">
            <Monitor size={20} variant="Bold" color="white" />
          </div>
          <span>Evolution API Monitor</span>
        </Link>

        <nav
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--color-text-muted)]"
          aria-label={t('Principal', 'Primary')}
        >
          <a href="#features" className="transition-colors hover:text-[var(--color-text-primary)]">
            {t('Recursos', 'Features')}
          </a>
          <a href="#pricing" className="transition-colors hover:text-[var(--color-text-primary)]">
            {t('Preços', 'Pricing')}
          </a>
          <a href="#open-source" className="transition-colors hover:text-[var(--color-text-primary)]">
            {t('Open source', 'Open source')}
          </a>
          <a
            href={openSourceRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-[var(--color-text-primary)]"
          >
            <Code size={18} variant="Linear" color="currentColor" aria-hidden />
            GitHub
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0 scale-90">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
          <Link
            href={DASHBOARD_HREF}
            className="hidden sm:flex rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('Começar', 'Get started')}
          </Link>
        </div>
      </div>
    </header>
  );
}
