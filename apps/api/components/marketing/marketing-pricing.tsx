import { TickCircle } from 'iconsax-react';

import { getServerTranslator } from '@/lib/i18n-server';

export async function MarketingPricing() {
  const t = await getServerTranslator();

  const plans = [
    {
      name: t('Free', 'Free'),
      price: t('R$ 0', '$0'),
      period: '',
      description: t('Para testar a ferramenta.', 'To test the tool.'),
      features: [
        t('Até 2 monitores', 'Up to 2 monitors'),
        t('Intervalo de 15 minutos', '15-minute interval'),
        t('Alertas via WhatsApp', 'Alerts via WhatsApp'),
        t('Alertas via Email e Webhook', 'Email and Webhook alerts'),
        t('Histórico de logs', 'Logs history'),
      ],
      cta: t('Começar grátis', 'Start for free'),
      href: '/login',
      highlight: false,
    },
    {
      name: t('Starter', 'Starter'),
      price: t('R$ 29', '$9'),
      period: t('/mês', '/mo'),
      description: t('Para pequenas operações.', 'For small operations.'),
      features: [
        t('Até 10 monitores', 'Up to 10 monitors'),
        t('Intervalo de 10 minutos', '10-minute interval'),
        t('Alertas via WhatsApp', 'Alerts via WhatsApp'),
        t('Alertas via Email e Webhook', 'Email and Webhook alerts'),
        t('Histórico de logs', 'Logs history'),
      ],
      cta: t('Assinar Starter', 'Subscribe Starter'),
      href: '/login',
      highlight: true,
    },
    {
      name: t('Pro', 'Pro'),
      price: t('R$ 59', '$19'),
      period: t('/mês', '/mo'),
      description: t('Para operações em crescimento.', 'For growing operations.'),
      features: [
        t('Até 50 monitores', 'Up to 50 monitors'),
        t('Intervalo de 5 minutos', '5-minute interval'),
        t('Alertas via WhatsApp', 'Alerts via WhatsApp'),
        t('Alertas via Email e Webhook', 'Email and Webhook alerts'),
        t('Histórico de logs', 'Logs history'),
      ],
      cta: t('Assinar Pro', 'Subscribe Pro'),
      href: '/login',
      highlight: false,
    },
    {
      name: t('Enterprise', 'Enterprise'),
      price: t('Sob consulta', 'Custom'),
      period: '',
      description: t('Para grandes volumes.', 'For high volumes.'),
      features: [
        t('Mais de 50 monitores', 'More than 50 monitors'),
        t('Intervalo personalizado', 'Custom interval'),
        t('Suporte prioritário', 'Priority support'),
        t('SLA garantido', 'Guaranteed SLA'),
        t('Histórico de logs', 'Logs history'),
      ],
      cta: t('Falar com vendas', 'Contact sales'),
      href: 'mailto:contato@seudominio.com', // Update this later or let user change
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 sm:py-32" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="pricing-heading"
            className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl"
          >
            {t('Preços simples e transparentes', 'Simple and transparent pricing')}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-muted)]">
            {t(
              'Escolha o plano ideal para o tamanho da sua operação.',
              'Choose the ideal plan for the size of your operation.'
            )}
          </p>
        </div>
        
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-4 lg:gap-x-8 lg:gap-y-0">
          {plans.map((plan) => (
            <div
                key={plan.name}
                className={`rounded-3xl p-8 ring-1 xl:p-10 flex flex-col bg-[var(--color-surface)] shadow-sm ${
                  plan.highlight
                    ? 'ring-2 ring-[var(--color-accent)] shadow-md'
                    : 'ring-[var(--color-border)]'
                }`}
              >
              <div className="mb-8">
                <h3 className="text-lg font-semibold leading-8 text-[var(--color-text-primary)]">
                  {plan.name}
                </h3>
                <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
                  {plan.description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className={`font-bold tracking-tight text-[var(--color-text-primary)] whitespace-nowrap ${plan.price.length > 8 ? 'text-3xl' : 'text-4xl'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm font-semibold leading-6 text-[var(--color-text-muted)]">
                      {plan.period}
                    </span>
                  )}
                </p>
              </div>
              <ul
                role="list"
                className="mb-8 space-y-3 text-sm leading-6 text-[var(--color-text-muted)] flex-1"
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <TickCircle
                      size={20}
                      className="text-[var(--color-accent)] flex-none"
                      aria-hidden="true"
                      variant="Bold"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className={`mt-auto block rounded-md border border-[var(--color-border)] px-3 py-2 text-center text-sm font-extrabold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all ${
                  plan.highlight
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)] hover:bg-[var(--color-accent)]/80 focus-visible:outline-[var(--color-accent)] shadow-sm'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/50 focus-visible:outline-[var(--color-border)]'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
