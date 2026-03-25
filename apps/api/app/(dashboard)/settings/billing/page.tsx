import { BillingService } from '@/services/billing.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServerTranslator } from '@/lib/i18n-server';
import { BillingActions } from '@/components/billing/billing-actions';
import { ShieldTick, Receipt2, InfoCircle, CardTick, Clock } from 'iconsax-react';

export default async function BillingPage() {
  const t = await getServerTranslator();
  const session = await getServerSession(authOptions);
  const sub = await BillingService.getSubscription(session!.user!.id);

  function formatDate(d?: Date | null) {
    if (!d) return '-';
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(d);
  }

  function formatMoney(cents: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      cents / 100,
    );
  }

  const isSelfHosted = !sub.billingEnabled;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-semibold text-[var(--color-text-primary)]">
          {t('Cobrança e Assinatura', 'Billing & Subscription')}
        </h1>
        <p className="text-[var(--color-text-muted)]">
          {isSelfHosted
            ? t(
                'Ambiente Self-hosted. O controle de cobrança e faturamento está desativado.',
                'Self-hosted environment. Billing and invoicing are disabled.',
              )
            : t(
                'Gerencie sua assinatura, métodos de pagamento e visualize seu histórico de faturamento.',
                'Manage your subscription, payment methods, and view your billing history.',
              )}
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        {/* Status Card */}
        <div className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldTick size={24} className="text-[var(--color-accent)]" variant="Bulk" />
            <h3 className="text-sm font-medium text-[var(--color-text-muted)]">
              {t('Status da Assinatura', 'Subscription Status')}
            </h3>
          </div>
          <div className="mt-auto">
            <span className="inline-flex items-center rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-sm font-medium text-[var(--color-accent)]">
              {isSelfHosted ? 'Self-Hosted' : sub.status ? sub.status.toUpperCase() : 'INATIVO'}
            </span>
          </div>
        </div>

        {/* Active Numbers Card */}
        <div className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <InfoCircle size={24} className="text-[var(--color-accent)]" variant="Bulk" />
            <h3 className="text-sm font-medium text-[var(--color-text-muted)]">
              {t('Números Ativos', 'Active Numbers')}
            </h3>
          </div>
          <div className="mt-auto">
            <p className="text-3xl font-semibold text-[var(--color-text-primary)]">
              {sub.activeNumbers}
            </p>
          </div>
        </div>

        {/* Monthly Amount Card */}
        <div className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Receipt2 size={24} className="text-[var(--color-accent)]" variant="Bulk" />
            <h3 className="text-sm font-medium text-[var(--color-text-muted)]">
              {t('Valor Mensal', 'Monthly Amount')}
            </h3>
          </div>
          <div className="mt-auto">
            <p className="text-3xl font-semibold text-[var(--color-text-primary)]">
              {isSelfHosted ? formatMoney(0) : formatMoney(sub.monthlyAmountCents)}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-6 py-5">
          <CardTick size={20} className="text-[var(--color-text-primary)]" variant="Bulk" />
          <h3 className="text-base font-medium text-[var(--color-text-primary)]">
            {t('Detalhes do Plano', 'Plan Details')}
          </h3>
        </div>
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)]">
                <Clock size={16} />
                {t('Fim do Período de Teste', 'Trial Ends At')}
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-[var(--color-text-primary)]">
                {formatDate(sub.trialEndsAt)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)]">
                <Clock size={16} />
                {t('Fim do Ciclo Atual', 'Current Period End')}
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-[var(--color-text-primary)]">
                {formatDate(sub.currentPeriodEnd)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)]">
                <Clock size={16} />
                {t('Tolerância de Atraso', 'Past Due Grace Ends At')}
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-[var(--color-text-primary)]">
                {formatDate(sub.pastDueGraceEndsAt)}
              </dd>
            </div>
            {sub.stripeCustomerId && (
              <div className="sm:col-span-1">
                <dt className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)]">
                  <InfoCircle size={16} />
                  {t('ID do Cliente Stripe', 'Stripe Customer ID')}
                </dt>
                <dd className="mt-1.5 text-sm text-[var(--color-text-primary)]">
                  <span className="rounded border border-[var(--color-border)] bg-[var(--color-border)]/50 px-2 py-1 font-mono text-xs">
                    {sub.stripeCustomerId}
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {sub.billingEnabled && (
          <div className="flex items-center border-t border-[var(--color-border)] bg-[var(--color-border)]/20 px-6 py-4">
            <BillingActions billingEnabled={sub.billingEnabled} />
          </div>
        )}
      </div>
    </div>
  );
}
