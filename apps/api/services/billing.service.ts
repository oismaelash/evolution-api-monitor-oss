import { loadEnv } from '@monitor/shared';
import { prisma } from '@monitor/database';

export const BillingService = {
  async getSubscription(userId: string) {
    const env = loadEnv();
    const sub = await prisma.subscription.findUnique({
      where: { userId },
    });
    if (!env.CLOUD_BILLING) {
      return {
        billingEnabled: false,
        status: sub?.status ?? 'TRIALING',
        activeNumbers: sub?.activeNumbers ?? 0,
        monthlyAmountCents: sub?.monthlyAmountCents ?? 0,
        trialEndsAt: sub?.trialEndsAt,
        currentPeriodEnd: sub?.currentPeriodEnd,
      };
    }
    return {
      billingEnabled: true,
      status: sub?.status,
      activeNumbers: sub?.activeNumbers ?? 0,
      monthlyAmountCents: sub?.monthlyAmountCents ?? 0,
      trialEndsAt: sub?.trialEndsAt,
      currentPeriodEnd: sub?.currentPeriodEnd,
      stripeCustomerId: sub?.stripeCustomerId,
    };
  },
};
