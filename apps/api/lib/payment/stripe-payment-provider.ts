import type { BillingWebhookEvent, PaymentProvider } from '@monitor/shared';
import { SubscriptionStatus, loadEnv } from '@monitor/shared';
import Stripe from 'stripe';

/** Webhook payload shape (avoids `Subscription` name clash with Prisma in some TS setups). */
type StripeSubscriptionPayload = {
  id: string;
  status: Stripe.Subscription.Status;
  customer: string | Stripe.Customer | Stripe.DeletedCustomer;
  trial_end: number | null;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean | null;
  items: { data: { quantity?: number }[] };
};

type StripeInvoicePayload = {
  subscription?: string | { id?: string } | null;
};

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'unpaid':
      return SubscriptionStatus.UNPAID;
    default:
      return SubscriptionStatus.ACTIVE;
  }
}

export class StripePaymentProvider implements PaymentProvider {
  private readonly stripe: Stripe;

  constructor(
    secretKey: string,
    private readonly webhookSecret: string
  ) {
    this.stripe = new Stripe(secretKey);
  }

  async createCustomer(userId: string, email: string): Promise<string> {
    const c = await this.stripe.customers.create({
      metadata: { userId },
      email,
    });
    return c.id;
  }

  async createCheckoutSession(input: {
    userId: string;
    customerId: string;
    successUrl: string;
    cancelUrl: string;
    quantity: number;
  }): Promise<{ url: string | null }> {
    const priceId = loadEnv().STRIPE_PRICE_ID;
    if (!priceId) {
      return { url: null };
    }
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: input.customerId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      client_reference_id: input.userId,
      subscription_data: {
        metadata: { userId: input.userId },
      },
      line_items: [
        {
          price: priceId,
          quantity: Math.max(1, input.quantity),
        },
      ],
    });
    return { url: session.url };
  }

  async createBillingPortalSession(input: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string | null }> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
    });
    return { url: session.url };
  }

  async updateQuantity(subscriptionId: string, quantity: number): Promise<void> {
    const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
    const item = sub.items.data[0];
    if (!item) return;
    await this.stripe.subscriptionItems.update(item.id, {
      quantity: Math.max(1, quantity),
      proration_behavior: 'create_prorations',
    });
  }

  async cancelSubscription(subscriptionId: string, atPeriodEnd: boolean): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: atPeriodEnd,
    });
    if (!atPeriodEnd) {
      await this.stripe.subscriptions.cancel(subscriptionId);
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<BillingWebhookEvent> {
    const evt = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    const id = evt.id;
    if (evt.type === 'checkout.session.completed') {
      const s = evt.data.object as Stripe.Checkout.Session;
      return {
        id,
        type: 'checkout.session.completed',
        stripeCustomerId: typeof s.customer === 'string' ? s.customer : s.customer?.id,
        stripeSubscriptionId:
          typeof s.subscription === 'string' ? s.subscription : s.subscription?.id ?? undefined,
        raw: evt,
      };
    }
    if (evt.type === 'customer.subscription.updated' || evt.type === 'customer.subscription.deleted') {
      const sub = evt.data.object as unknown as StripeSubscriptionPayload;
      const status = mapStripeStatus(sub.status);
      return {
        id,
        type:
          evt.type === 'customer.subscription.deleted'
            ? 'customer.subscription.deleted'
            : 'customer.subscription.updated',
        stripeSubscriptionId: sub.id,
        stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
        status,
        trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : null,
        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
        quantity: sub.items.data[0]?.quantity,
        raw: evt,
      };
    }
    if (evt.type === 'invoice.payment_failed') {
      const inv = evt.data.object as StripeInvoicePayload;
      const subId =
        typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id ?? undefined;
      return {
        id,
        type: 'invoice.payment_failed',
        stripeSubscriptionId: subId,
        status: SubscriptionStatus.PAST_DUE,
        raw: evt,
      };
    }
    if (evt.type === 'invoice.paid') {
      const inv = evt.data.object as StripeInvoicePayload;
      const subId =
        typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id ?? undefined;
      return {
        id,
        type: 'invoice.paid',
        stripeSubscriptionId: subId,
        status: SubscriptionStatus.ACTIVE,
        raw: evt,
      };
    }
    return { id, type: 'unknown', raw: evt };
  }
}
