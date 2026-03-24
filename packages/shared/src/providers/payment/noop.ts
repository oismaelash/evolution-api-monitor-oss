import type { BillingWebhookEvent, PaymentProvider } from './types.js';

export class NoOpPaymentProvider implements PaymentProvider {
  async createCustomer(): Promise<string> {
    return 'noop_customer';
  }

  async createCheckoutSession(): Promise<{ url: string | null }> {
    return { url: null };
  }

  async createBillingPortalSession(): Promise<{ url: string | null }> {
    return { url: null };
  }

  async updateQuantity(): Promise<void> {}

  async cancelSubscription(): Promise<void> {}

  async handleWebhook(): Promise<BillingWebhookEvent> {
    throw new Error('Billing disabled (NoOpPaymentProvider)');
  }
}
