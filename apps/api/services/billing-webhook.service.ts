import { prisma } from '@monitor/database';
import type { BillingWebhookEvent } from '@monitor/shared';
import { SubscriptionStatus } from '@monitor/shared';
import type Stripe from 'stripe';
import { BillingSyncService } from './billing-sync.service';

const GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export async function processBillingWebhookEvent(event: BillingWebhookEvent): Promise<void> {
  if (event.type === 'unknown') return;

  if (event.type === 'checkout.session.completed') {
    const obj = event.raw as Stripe.Event;
    const s = obj.data.object as Stripe.Checkout.Session;
    const userId = s.client_reference_id;
    if (!userId) return;
    const stripeSub =
      typeof s.subscription === 'string' ? s.subscription : s.subscription?.id ?? undefined;
    const stripeCust =
      typeof s.customer === 'string' ? s.customer : s.customer?.id ?? undefined;
    if (!stripeSub || !stripeCust) return;
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: stripeCust,
        stripeSubscriptionId: stripeSub,
        status: SubscriptionStatus.ACTIVE as never,
      },
      update: {
        stripeCustomerId: stripeCust,
        stripeSubscriptionId: stripeSub,
        status: SubscriptionStatus.ACTIVE as never,
      },
    });
    await BillingSyncService.syncActiveNumberCount(userId);
    return;
  }

  if (
    event.stripeSubscriptionId &&
    (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted')
  ) {
    const sub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: event.stripeSubscriptionId },
    });
    if (!sub) return;
    const status = (
      event.type === 'customer.subscription.deleted'
        ? SubscriptionStatus.CANCELED
        : (event.status ?? SubscriptionStatus.ACTIVE)
    ) as never;
    const pastDueGraceEndsAt =
      status === SubscriptionStatus.PAST_DUE ? new Date(Date.now() + GRACE_MS) : null;
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: status as never,
        trialEndsAt: event.trialEndsAt ?? undefined,
        currentPeriodStart: event.currentPeriodStart ?? undefined,
        currentPeriodEnd: event.currentPeriodEnd ?? undefined,
        cancelAtPeriodEnd: event.cancelAtPeriodEnd ?? false,
        pastDueGraceEndsAt,
      },
    });
    if (event.quantity != null) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { activeNumbers: event.quantity },
      });
    }
    return;
  }

  if (event.type === 'invoice.payment_failed' && event.stripeSubscriptionId) {
    const sub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: event.stripeSubscriptionId },
    });
    if (!sub) return;
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.PAST_DUE,
        pastDueGraceEndsAt: new Date(Date.now() + GRACE_MS),
      },
    });
    return;
  }

  if (event.type === 'invoice.paid' && event.stripeSubscriptionId) {
    const sub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: event.stripeSubscriptionId },
    });
    if (!sub) return;
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        pastDueGraceEndsAt: null,
      },
    });
  }
}
