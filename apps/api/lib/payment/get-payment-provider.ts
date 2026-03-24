import type { PaymentProvider } from '@monitor/shared';
import { NoOpPaymentProvider, loadEnv } from '@monitor/shared';
import { StripePaymentProvider } from './stripe-payment-provider';

export function getPaymentProvider(): PaymentProvider {
  const env = loadEnv();
  if (!env.CLOUD_BILLING || !env.STRIPE_SECRET_KEY) {
    return new NoOpPaymentProvider();
  }
  return new StripePaymentProvider(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET ?? '');
}
