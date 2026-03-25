import { DocumentText, Health, Notification, RefreshCircle } from 'iconsax-react';

import { getServerTranslator } from '@/lib/i18n-server';

export async function MarketingFeatures() {
  const t = await getServerTranslator();

  const features = [
    {
      title: t(
        'Detecte problemas antes de afetarem a receita',
        'Catch problems before they hurt revenue',
      ),
      description: t(
        'Health checks regulares em cada instância para que desconexões silenciosas e sessões instáveis apareçam cedo — não depois de reclamações.',
        'Regular health checks on every instance so silent disconnects and flaky sessions surface early—not after someone complains.',
      ),
      Icon: Health,
    },
    {
      title: t(
        'Recuperação que roda enquanto você dorme',
        'Recovery that runs while you sleep',
      ),
      description: t(
        'Novas tentativas e reinícios automáticos em sequência segura — sua equipe gasta menos tempo apagando incêndio em painéis.',
        'Automatic retries and restarts in a safe sequence—so your team spends less time firefighting in admin panels.',
      ),
      Icon: RefreshCircle,
    },
    {
      title: t(
        'Alertas onde sua equipe já está',
        'Alerts where your team already is',
      ),
      description: t(
        'Envie notificações por WhatsApp, e-mail ou seu próprio endpoint — modelos que você controla, com fallback se um canal falhar.',
        'Send notifications over WhatsApp, email, or your own endpoint—templates you control, with fallbacks if one path fails.',
      ),
      Icon: Notification,
    },
    {
      title: t(
        'Respostas quando você pergunta “o que aconteceu?”',
        'Answers when you ask “what happened?”',
      ),
      description: t(
        'Filtre o histórico por projeto ou número, veja a história completa de checks e incidentes, e exporte quando stakeholders precisarem de provas.',
        'Filter history by project or number, see the full story of checks and incidents, and export when stakeholders need proof.',
      ),
      Icon: DocumentText,
    },
  ] as const;

  return (
    <section id="features" className="py-20 sm:py-24" aria-labelledby="features-heading">
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="features-heading"
          className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]"
        >
          {t('O que você ganha', 'What you get')}
        </h2>
        <p className="mt-4 text-[var(--color-text-muted)]">
          {t(
            'Menos surpresas, recuperação mais rápida e registro claro de cada incidente — para operações ficar à frente do suporte.',
            'Fewer surprises, faster recovery, and a clear record of every incident—so operations stays ahead of customer support.',
          )}
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
