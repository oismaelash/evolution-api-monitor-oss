import { prisma } from '@monitor/database';
import { loadEnv, SubscriptionStatus } from '@monitor/shared';
import { getPaymentProvider } from '@/lib/payment/get-payment-provider';

export const BillingSyncService = {
  async syncActiveNumberCount(userId: string): Promise<void> {
    const count = await prisma.number.count({
      where: { monitored: true, project: { userId } },
    });
    const env = loadEnv();
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        activeNumbers: count,
        status: (env.CLOUD_BILLING ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE) as never,
        trialEndsAt: env.CLOUD_BILLING
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          : null,
      },
      update: { activeNumbers: count },
    });
    if (!env.CLOUD_BILLING) return;
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub?.stripeSubscriptionId) return;
    try {
      const provider = getPaymentProvider();
      await provider.updateQuantity(sub.stripeSubscriptionId, count);
    } catch {
      // Stripe not configured or noop
    }
  },
};
