import type { SubscriptionStatus } from '../../enums.js';

export type BillingWebhookEventType =
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_failed'
  | 'invoice.paid'
  | 'checkout.session.completed'
  | 'pague.subscription.updated'
  | 'unknown';

export type BillingWebhookEvent = {
  id: string;
  type: BillingWebhookEventType;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  status?: SubscriptionStatus;
  trialEndsAt?: Date | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  quantity?: number;
  raw?: unknown;
};

export interface PaymentProvider {
  createCustomer(userId: string, email: string): Promise<string>;
  createCheckoutSession(input: {
    userId: string;
    customerId: string;
    successUrl: string;
    cancelUrl: string;
    quantity: number;
  }): Promise<{ url: string | null }>;
  createBillingPortalSession(input: { customerId: string; returnUrl: string }): Promise<{ url: string | null }>;
  updateQuantity(subscriptionId: string, quantity: number): Promise<void>;
  cancelSubscription(subscriptionId: string, atPeriodEnd: boolean): Promise<void>;
  handleWebhook(rawBody: Buffer, signature: string): Promise<BillingWebhookEvent>;
}
