import { loadEnv } from '@monitor/shared';

import { getServerTranslator } from '@/lib/i18n-server';

export async function MarketingFooter() {
  const t = await getServerTranslator();
  const openSourceRepoUrl = loadEnv().OPEN_SOURCE_REPO_URL;

  const links = [
    { label: t('Documentação', 'Documentation'), href: '/docs' },
    { label: t('Cloud', 'Cloud'), href: '/dashboard' },
    { label: 'GitHub', href: openSourceRepoUrl },
    { label: t('Privacidade', 'Privacy'), href: '/privacy' },
    { label: t('Termos', 'Terms'), href: '/terms' },
  ] as const;

  return (
    <footer className="border-t border-[var(--color-border)] py-12" role="contentinfo">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text-primary)]">Evolution API Monitor</span>
          {' · '}
          evolutionapi.online
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--color-text-muted)]">
          {links.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                className="transition-colors hover:text-[var(--color-text-primary)]"
                {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-8 text-xs text-[var(--color-text-muted)]">
        {t(
          'Não afiliado à Meta. WhatsApp é marca registrada da Meta Platforms, Inc.',
          'Not affiliated with Meta. WhatsApp is a trademark of Meta Platforms, Inc.',
        )}
      </p>
    </footer>
  );
}
