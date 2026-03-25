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
    <section id="features" className="py-24 sm:py-32" aria-labelledby="features-heading">
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="features-heading"
          className="text-3xl font-bold tracking-tight text-white sm:text-5xl"
        >
          {t('O que você ganha', 'Everything you need')}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-muted)]">
          {t(
            'Menos surpresas, recuperação mais rápida e registro claro de cada incidente — para operações ficar à frente do suporte.',
            'Fewer surprises, faster recovery, and a clear record of every incident—so operations stays ahead of customer support.',
          )}
        </p>
      </div>
      <ul className="mt-20 grid gap-8 sm:grid-cols-2 lg:gap-10">
        {features.map(({ title, description, Icon }) => (
          <li
            key={title}
            className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-[var(--color-accent)]/50 hover:shadow-2xl hover:shadow-accent/10"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] transition-colors group-hover:bg-[var(--color-accent)] group-hover:text-white">
              <Icon size={28} variant="Bold" color="currentColor" aria-hidden />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-text-muted)] group-hover:text-white/80 transition-colors">
              {description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
