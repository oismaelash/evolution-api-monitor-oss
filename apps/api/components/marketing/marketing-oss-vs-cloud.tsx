import Link from 'next/link';

import { Cloud, Code } from 'iconsax-react';

import { getServerTranslator } from '@/lib/i18n-server';

export async function MarketingOssVsCloud() {
  const t = await getServerTranslator();

  return (
    <section
      id="open-source"
      className="py-20 sm:py-24"
      aria-labelledby="oss-cloud-heading"
    >
      <h2
        id="oss-cloud-heading"
        className="sr-only"
      >
        {t('Open source e Cloud', 'Open source and Cloud')}
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <div className="flex items-center gap-2 text-[var(--color-accent)]">
            <Code size={22} variant="Bold" color="currentColor" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wide">
              {t('Open source', 'Open source')}
            </span>
          </div>
          <p className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">
            {t('Rode na sua stack', 'Run it on your stack')}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {t(
              'Execute o monitor ao lado da sua stack Evolution na infraestrutura que você escolher. Controle total de dados e deploy — sem lock-in no produto principal.',
              'Run the monitor next to your Evolution stack on infrastructure you choose. Keep full control of data and deployment—no lock-in on the core product.',
            )}
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block text-sm font-semibold text-[var(--color-accent)] hover:underline"
          >
            {t('Repositório (placeholder) →', 'Repository (placeholder) →')}
          </a>
        </div>
        <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-surface)] p-8 ring-1 ring-[var(--color-accent)]/20">
          <div className="flex items-center gap-2 text-[var(--color-accent)]">
            <Cloud size={22} variant="Bold" color="currentColor" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wide">
              {t('Cloud', 'Cloud')}
            </span>
          </div>
          <p className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">
            {t('Gerenciado em cloud.evolutionapi.online', 'Managed at cloud.evolutionapi.online')}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {t(
              'Hospedamos para você: comece com trial, escale com cobrança simples e gaste menos tempo rodando infraestrutura — mesmas capacidades, menos operação.',
              'We host it for you: start with a trial, scale with straightforward billing, and spend less time running infrastructure—same capabilities, less ops overhead.',
            )}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t('Ir para a Cloud', 'Go to Cloud')}
          </Link>
        </div>
      </div>
    </section>
  );
}
