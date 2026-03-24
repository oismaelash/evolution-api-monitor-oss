import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@monitor/database';
import { loadEnv } from '@monitor/shared';
import { authOptions } from '@/lib/auth';
import { getPaymentProvider } from '@/lib/payment/get-payment-provider';

export async function POST(req: NextRequest) {
  const env = loadEnv();
  if (!env.CLOUD_BILLING) {
    return NextResponse.json({ error: 'Billing disabled' }, { status: 404 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 });
  }
  const provider = getPaymentProvider();
  const origin = req.nextUrl.origin;
  const { url } = await provider.createBillingPortalSession({
    customerId: sub.stripeCustomerId,
    returnUrl: `${origin}/settings/billing`,
  });
  if (!url) {
    return NextResponse.json({ error: 'Portal unavailable' }, { status: 503 });
  }
  return NextResponse.json({ url });
}
