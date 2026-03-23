import { Cpu, DocumentText, Health, Notification } from 'iconsax-react';

const features = [
  {
    title: 'Health & presence checks',
    description:
      'Periodic pings against your Evolution instances so you see connection issues before users do.',
    Icon: Health,
  },
  {
    title: 'Worker & queues',
    description:
      'Background jobs with BullMQ and Redis—retries, delays, and safe locking around instance state.',
    Icon: Cpu,
  },
  {
    title: 'Alerts that reach you',
    description:
      'WhatsApp via Pilot Status, email, and webhooks—templates you control, with fallbacks.',
    Icon: Notification,
  },
  {
    title: 'Structured logs',
    description:
      'Filter by project or number, export when you need to—JSON logs built for operators.',
    Icon: DocumentText,
  },
] as const;

export function MarketingFeatures() {
  return (
    <section id="features" className="py-20 sm:py-24" aria-labelledby="features-heading">
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="features-heading"
          className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]"
        >
          Built for production Evolution deployments
        </h2>
        <p className="mt-4 text-[var(--color-text-muted)]">
          One place to monitor numbers, automate recovery, and notify your team.
        </p>
      </div>
      <ul className="mt-14 grid gap-6 sm:grid-cols-2">
        {features.map(({ title, description, Icon }) => (
          <li
            key={title}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-accent)]/40"
          >
            <Icon size={24} variant="Bold" color="var(--color-accent)" aria-hidden />
            <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
