import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { loadEnv } from '@monitor/shared';
import { getRedis } from '@/lib/redis';

function verifyPagueSignature(raw: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;

  // 1. Calcule a signing key: SHA256(seu_webhook_secret) em hex
  const signingKey = createHash('sha256').update(secret).digest('hex');

  // 2. Calcule o HMAC-SHA256 do body da requisição usando a signing key
  const h = createHmac('sha256', signingKey).update(raw).digest('hex');

  try {
    // 3. Compare o resultado com o header X-Webhook-Signature usando comparação em tempo constante
    return timingSafeEqual(Buffer.from(h), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const env = loadEnv();
  if (!env.CLOUD_BILLING) {
    return NextResponse.json({ error: 'Billing disabled' }, { status: 404 });
  }
  const secret = env.PAGUE_DEV_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 501 });
  }
  const raw = await req.text();
  const sig = req.headers.get('X-Webhook-Signature');

  if (!verifyPagueSignature(raw, sig, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let body: { eventId?: string; event?: string; data?: unknown };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventId = body.eventId;
  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
  }

  const redis = getRedis();
  const processedKey = `webhook:processed:pague:${eventId}`;
  const processed = await redis.get(processedKey);
  if (processed) {
    return NextResponse.json({ ok: true });
  }

  await redis.set(processedKey, '1', 'EX', 86400);

  // TODO: Em uma implementação real, aqui processaríamos body.event (ex: payment_completed)

  return NextResponse.json({ ok: true, received: body.event });
}
