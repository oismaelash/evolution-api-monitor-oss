import Link from 'next/link';

import { Cloud, Code } from 'iconsax-react';

const CLOUD_URL = 'https://cloud.evolutionapi.online';

export function MarketingHeader() {
  return (
    <header className="flex flex-col gap-6 border-b border-[var(--color-border)] py-8 sm:flex-row sm:items-center sm:justify-between">
      <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
        Pilot Status Monitor
      </Link>
      <nav
        className="flex flex-wrap items-center gap-6 text-sm text-[var(--color-text-muted)]"
        aria-label="Primary"
      >
        <a href="#features" className="transition-colors hover:text-[var(--color-text-primary)]">
          Features
        </a>
        <a href="#open-source" className="transition-colors hover:text-[var(--color-text-primary)]">
          Open source
        </a>
        <a
          href={CLOUD_URL}
          className="inline-flex items-center gap-1.5 font-medium text-[var(--color-accent)] transition-opacity hover:opacity-90"
        >
          <Cloud size={18} variant="Bold" color="currentColor" aria-hidden />
          Cloud
        </a>
        <a
          href={CLOUD_URL}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Get started
        </a>
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
