import { BillingService } from '@/services/billing.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServerTranslator } from '@/lib/i18n-server';
import { BillingActions } from '@/components/billing/billing-actions';

export default async function BillingPage() {
  const t = await getServerTranslator();
  const session = await getServerSession(authOptions);
  const sub = await BillingService.getSubscription(session!.user!.id);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">{t('Cobrança', 'Billing')}</h1>
      <p className="mb-6 text-[var(--color-text-muted)]">
        {sub.billingEnabled
          ? t(
              'Cobrança cloud ativa. Assine via Stripe ou gerencie sua assinatura no portal.',
              'Cloud billing is enabled. Subscribe via Stripe or manage your subscription in the portal.',
            )
          : t(
              'Self-hosted / cobrança desativada (NoOp).',
              'Self-hosted / billing disabled (NoOp).',
            )}
      </p>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm">
        <pre className="overflow-auto text-[var(--color-text-muted)]">
          {JSON.stringify(sub, null, 2)}
        </pre>
      </div>
      <BillingActions billingEnabled={sub.billingEnabled} />
    </div>
  );
}
