import { BillingService } from '@/services/billing.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const sub = await BillingService.getSubscription(session!.user!.id);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Billing</h1>
      <p className="mb-6 text-[var(--color-text-muted)]">
        {sub.billingEnabled
          ? 'Cloud billing is enabled.'
          : 'Self-hosted / billing disabled (NoOp).'}
      </p>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm">
        <pre className="overflow-auto text-[var(--color-text-muted)]">
          {JSON.stringify(sub, null, 2)}
        </pre>
      </div>
    </div>
  );
}
