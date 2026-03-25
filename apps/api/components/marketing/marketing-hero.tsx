import Link from 'next/link';

import { Monitor } from 'iconsax-react';
import { loadEnv } from '@monitor/shared';

import { getServerTranslator } from '@/lib/i18n-server';
import { MarketingDashboardMock } from '@/components/marketing/marketing-dashboard-mock';

export async function MarketingHero() {
  const t = await getServerTranslator();
  const openSourceRepoUrl = loadEnv().OPEN_SOURCE_REPO_URL;

  return (
    <section className="relative py-20 sm:py-32" aria-labelledby="hero-heading">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {/* <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] backdrop-blur-md">
            <Monitor size={14} variant="Bold" color="currentColor" aria-hidden />
            <span className="bg-gradient-to-r from-[var(--color-accent)] to-purple-400 bg-clip-text text-transparent">
              {t('Monitoramento em Tempo Real', 'Real-time Monitoring')}
            </span>
          </p> */}
          <div className="inline-flex animate-pulse items-center gap-2 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-4 py-1.5 text-sm font-bold tracking-wide text-[var(--color-text-primary)] shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]"></span>
            </span>
            {t('✨ Novo: Suporte total ao Evolution GO!', '✨ New: Full support for Evolution GO!')}
          </div>
        </div>

        <h1
          id="hero-heading"
          className="text-balance text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-7xl lg:text-8xl drop-shadow-sm"
        >
          <span className="block">{t('Pare de perder dinheiro com', 'Stop losing money with')}</span>
          <span className="mt-2 block bg-gradient-to-r from-emerald-400 via-[var(--color-accent)] to-teal-400 bg-clip-text text-transparent text-glow">
            {t('conexões caindo no WhatsApp', 'WhatsApp connections dropping')}
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--color-text-muted)] sm:text-xl">
          {t(
            'Não espere o cliente reclamar que sua operacao parou. Receba alertas imediatos e garanta 100% de estabilidade na sua Evolution API ou Evolution GO.',
            'Don\'t wait for customers to complain that your operation stopped. Get instant alerts and ensure 100% stability for your Evolution API or Evolution GO.',
          )}
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/dashboard"
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent)] px-8 py-4 text-base font-extrabold text-[var(--color-accent-text)] shadow-xl shadow-[rgba(var(--color-accent-rgb),0.3)] transition-all hover:shadow-[rgba(var(--color-accent-rgb),0.5)] hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('Começar na Cloud', 'Start on Cloud')}
          </Link>
          <a
            href={openSourceRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-4 text-base font-bold text-[var(--color-text-primary)] backdrop-blur-md transition-all hover:bg-[var(--color-border)]/50 active:scale-[0.98]"
          >
            {t('Self-host (GitHub)', 'Self-host (GitHub)')}
          </a>
        </div>
      </div>

      <div className="mt-20 relative px-4 sm:px-0">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-transparent z-10" />
        <div className="relative mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm shadow-2xl animate-float">
          <MarketingDashboardMock />
        </div>
      </div>
    </section>
  );
}
