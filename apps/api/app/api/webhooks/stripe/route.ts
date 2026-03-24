import { NextRequest, NextResponse } from 'next/server';
import { loadEnv } from '@monitor/shared';
import { getPaymentProvider } from '@/lib/payment/get-payment-provider';
import { getRedis } from '@/lib/redis';
import { processBillingWebhookEvent } from '@/services/billing-webhook.service';

export async function POST(req: NextRequest) {
  const env = loadEnv();
  if (!env.CLOUD_BILLING) {
    return NextResponse.json({ error: 'Billing disabled' }, { status: 404 });
  }
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 501 });
  }
  const rawBody = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get('stripe-signature') ?? '';
  let event;
  try {
    event = await getPaymentProvider().handleWebhook(rawBody, signature);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  const redis = getRedis();
  const processed = await redis.get(`webhook:processed:${event.id}`);
  if (processed) {
    return NextResponse.json({ ok: true });
  }
  await processBillingWebhookEvent(event);
  await redis.set(`webhook:processed:${event.id}`, '1', 'EX', 86400);
  return NextResponse.json({ ok: true });
}
