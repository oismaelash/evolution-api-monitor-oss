import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { loadEnv } from '@monitor/shared';
import { getRedis } from '@/lib/redis';

function verifyPagueSignature(raw: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const h = createHmac('sha256', secret).update(raw).digest('hex');
  try {
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
  const sig = req.headers.get('x-pague-signature') ?? req.headers.get('x-signature');
  if (!verifyPagueSignature(raw, sig, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  let body: { id?: string; event?: string; data?: unknown };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const id = body.id ?? `pague:${Date.now()}`;
  const redis = getRedis();
  const processed = await redis.get(`webhook:processed:${id}`);
  if (processed) {
    return NextResponse.json({ ok: true });
  }
  await redis.set(`webhook:processed:${id}`, '1', 'EX', 86400);
  return NextResponse.json({ ok: true, received: body.event });
}
