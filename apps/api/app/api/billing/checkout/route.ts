import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@monitor/database';
import { loadEnv, SubscriptionStatus } from '@monitor/shared';
import { authOptions } from '@/lib/auth';
import { getPaymentProvider } from '@/lib/payment/get-payment-provider';
import { BillingSyncService } from '@/services/billing-sync.service';

export async function POST(req: NextRequest) {
  const env = loadEnv();
  if (!env.CLOUD_BILLING) {
    return NextResponse.json({ error: 'Billing disabled' }, { status: 404 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }
  await BillingSyncService.syncActiveNumberCount(userId);
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const provider = getPaymentProvider();
  let customerId = sub?.stripeCustomerId;
  if (!customerId) {
    customerId = await provider.createCustomer(userId, user.email);
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: customerId,
        status: SubscriptionStatus.TRIALING as never,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      update: { stripeCustomerId: customerId },
    });
  }
  const quantity = sub?.activeNumbers ?? 1;
  const origin = req.nextUrl.origin;
  const { url } = await provider.createCheckoutSession({
    userId,
    customerId,
    successUrl: `${origin}/settings/billing?success=1`,
    cancelUrl: `${origin}/settings/billing?canceled=1`,
    quantity,
  });
  if (!url) {
    return NextResponse.json({ error: 'Checkout unavailable (set STRIPE_PRICE_ID)' }, { status: 503 });
  }
  return NextResponse.json({ url });
}
