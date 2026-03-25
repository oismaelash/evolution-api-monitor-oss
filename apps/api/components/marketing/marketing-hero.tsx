import Link from 'next/link';

import { Monitor } from 'iconsax-react';

import { getServerTranslator } from '@/lib/i18n-server';

export async function MarketingHero() {
  const t = await getServerTranslator();

  return (
    <section className="py-20 sm:py-28" aria-labelledby="hero-heading">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          <Monitor size={16} variant="Bold" color="var(--color-accent)" aria-hidden />
          {t('Todos os seus números em um só lugar', 'All your numbers in one place')}
        </p>
        <h1
          id="hero-heading"
          className="text-balance text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-5xl"
        >
          {t(
            'Saiba quando cada instância WhatsApp está saudável — ou corrija rápido.',
            'Know when every WhatsApp instance is healthy—or fix it fast.',
          )}
        </h1>
        <p className="mt-6 text-pretty text-lg leading-relaxed text-[var(--color-text-muted)]">
          {t(
            'Identifique problemas de conexão antes dos seus clientes, dispare recuperação automaticamente e receba alertas onde sua equipe já trabalha — com linha do tempo completa por projeto e número para nada acontecer no escuro.',
            'Spot connection issues before your customers do, trigger recovery automatically, and get alerts where your team already works—plus a full timeline per project and number so nothing happens in the dark.',
          )}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t('Começar na Cloud', 'Start on Cloud')}
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent)]"
          >
            {t('Self-host (GitHub)', 'Self-host (GitHub)')}
          </a>
        </div>
      </div>
    </section>
  );
}
