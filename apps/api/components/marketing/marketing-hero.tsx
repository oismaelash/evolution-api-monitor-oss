import { Monitor } from 'iconsax-react';

const CLOUD_URL = 'https://cloud.evolutionapi.online';

export function MarketingHero() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="hero-heading">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          <Monitor size={16} variant="Bold" color="var(--color-accent)" aria-hidden />
          Evolution API operations
        </p>
        <h1
          id="hero-heading"
          className="text-balance text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-5xl"
        >
          Know when every WhatsApp instance is healthy—or fix it fast.
        </h1>
        <p className="mt-6 text-pretty text-lg leading-relaxed text-[var(--color-text-muted)]">
          Pilot Status Monitor watches your Evolution API numbers: scheduled health checks, automated
          restarts, WhatsApp and webhook alerts, and structured logs you can filter by project or
          number.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href={CLOUD_URL}
            className="rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Start on Cloud
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent)]"
          >
            Self-host (GitHub)
          </a>
        </div>
      </div>
    </section>
  );
}
