import { DocumentText, Health, Notification, RefreshCircle } from 'iconsax-react';

const features = [
  {
    title: 'Catch problems before they hurt revenue',
    description:
      'Regular health checks on every instance so silent disconnects and flaky sessions surface early—not after someone complains.',
    Icon: Health,
  },
  {
    title: 'Recovery that runs while you sleep',
    description:
      'Automatic retries and restarts in a safe sequence—so your team spends less time firefighting in admin panels.',
    Icon: RefreshCircle,
  },
  {
    title: 'Alerts where your team already is',
    description:
      'Send notifications over WhatsApp, email, or your own endpoint—templates you control, with fallbacks if one path fails.',
    Icon: Notification,
  },
  {
    title: 'Answers when you ask “what happened?”',
    description:
      'Filter history by project or number, see the full story of checks and incidents, and export when stakeholders need proof.',
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
          What you get
        </h2>
        <p className="mt-4 text-[var(--color-text-muted)]">
          Fewer surprises, faster recovery, and a clear record of every incident—so operations stays
          ahead of customer support.
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
