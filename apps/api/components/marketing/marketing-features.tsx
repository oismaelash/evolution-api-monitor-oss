import { DocumentText, Health, Notification, RefreshCircle } from 'iconsax-react';

import { getServerTranslator } from '@/lib/i18n-server';

export async function MarketingFeatures() {
  const t = await getServerTranslator();

  const features = [
    {
      title: t(
        'Antecipe o caos antes que ele custe caro',
        'Stop chaos before it costs you',
      ),
      description: t(
        'Health checks em tempo real para que desconexões silenciosas sejam resolvidas antes de virarem reclamações de suporte.',
        'Real-time health checks so silent disconnects are resolved before they turn into support tickets.',
      ),
      Icon: Health,
    },
    {
      title: t(
        'Automação que salva sua escala',
        'Automation that saves your scale',
      ),
      description: t(
        'Reinícios automáticos inteligentes para que sua equipe pare de apagar incêndios manuais em painéis de administração.',
        'Smart automatic restarts so your team stops manual firefighting in admin panels.',
      ),
      Icon: RefreshCircle,
    },
    {
      title: t(
        'Alertas onde o dinheiro acontece',
        'Alerts where the money happens',
      ),
      description: t(
        'Envie notificações criticas por WhatsApp ou e-mail. Esteja ciente de quedas no segundo em que elas ocorrem.',
        'Send critical notifications via WhatsApp or email. Be aware of drops the second they happen.',
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
          {t('Sua operação não pode parar', 'Your operation can\'t stop')}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-muted)]">
          {t(
            'Recupere o controle total. Menos suporte, mais escala e zero surpresas desagradáveis no seu faturamento.',
            'Regain total control. Less support, more scale, and zero nasty surprises in your revenue.',
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
