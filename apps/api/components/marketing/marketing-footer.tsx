const CLOUD_URL = 'https://cloud.evolutionapi.online';

const links = [
  { label: 'Documentation', href: '/docs' },
  { label: 'Cloud', href: CLOUD_URL },
  { label: 'GitHub', href: 'https://github.com' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
] as const;

export function MarketingFooter() {
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
            <li key={label}>
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
        Not affiliated with Meta. WhatsApp is a trademark of Meta Platforms, Inc.
      </p>
    </footer>
  );
}
