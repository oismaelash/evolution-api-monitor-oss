import crypto from 'node:crypto';

import { prisma } from '@monitor/database';
import { loadEnv, SubscriptionStatus } from '@monitor/shared';

import { getRedis } from '@/lib/redis';

const OTP_TTL_SEC = 600;
const COOLDOWN_SEC = 60;
const MAX_REQUESTS_PER_HOUR = 10;

function logAuth(level: 'info' | 'warn' | 'error', event: string, meta: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    event,
    ...meta,
    ts: new Date().toISOString(),
  });
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

function maskE164(e164: string): string {
  if (e164.length <= 8) {
    return '***';
  }
  return `${e164.slice(0, 4)}***${e164.slice(-4)}`;
}

export function normalizeWhatsappE164(phone: string): string {
  const t = phone.trim();
  if (t.startsWith('+')) {
    return t;
  }
  return `+${t.replace(/^\+/, '')}`;
}

function otpStoreKey(e164: string): string {
  return `auth:otp:${e164}`;
}

function cooldownKey(e164: string): string {
  return `auth:otp:cooldown:${e164}`;
}

function hourlyKey(e164: string): string {
  return `auth:otp:hourly:${e164}`;
}

function hashOtp(e164: string, code: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${e164}:${code}`).digest('hex');
}

export async function verifyWhatsappOtp(phoneRaw: string, code: string): Promise<boolean> {
  const env = loadEnv();
  const e164 = normalizeWhatsappE164(phoneRaw);
  const redis = getRedis();
  const key = otpStoreKey(e164);
  const stored = await redis.get(key);
  if (!stored) {
    return false;
  }
  const digest = hashOtp(e164, code, env.NEXTAUTH_SECRET);
  const a = Buffer.from(stored, 'utf8');
  const b = Buffer.from(digest, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  if (!crypto.timingSafeEqual(a, b)) {
    return false;
  }
  await redis.del(key);
  return true;
}

export async function findOrCreateUserByWhatsapp(phoneRaw: string) {
  const e164 = normalizeWhatsappE164(phoneRaw);
  let user = await prisma.user.findUnique({ where: { whatsappNumber: e164 } });
  if (user) {
    return user;
  }
  const env = loadEnv();
  user = await prisma.user.create({
    data: { whatsappNumber: e164 },
  });
  if (env.CLOUD_BILLING) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        status: SubscriptionStatus.TRIALING as never,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
  }
  logAuth('info', 'auth_whatsapp_user_created', { userId: user.id, phone: maskE164(e164) });
  return user;
}

/**
 * Sends OTP via Pilot Status. Returns generic success when rate-limited (no enumeration).
 */
export async function requestWhatsappOtp(phoneRaw: string): Promise<
  { ok: true } | { ok: false; error: string; status: number }
> {
  const env = loadEnv();
  if (!env.MONITOR_STATUS_API_KEY?.trim()) {
    return { ok: false, error: 'WhatsApp login is not configured', status: 503 };
  }

  const e164 = normalizeWhatsappE164(phoneRaw);
  const redis = getRedis();

  const hourlyRaw = await redis.get(hourlyKey(e164));
  const hourlyCount = hourlyRaw ? parseInt(hourlyRaw, 10) : 0;
  if (hourlyCount >= MAX_REQUESTS_PER_HOUR) {
    logAuth('warn', 'auth_otp_hourly_cap', { phone: maskE164(e164) });
    return { ok: true };
  }

  const cooldownSet = await redis.set(cooldownKey(e164), '1', 'EX', COOLDOWN_SEC, 'NX');
  if (cooldownSet !== 'OK') {
    logAuth('warn', 'auth_otp_cooldown', { phone: maskE164(e164) });
    return { ok: true };
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const digest = hashOtp(e164, code, env.NEXTAUTH_SECRET);
  await redis.set(otpStoreKey(e164), digest, 'EX', OTP_TTL_SEC);

  try {
    const { PilotStatusClient } = await import('@pilot-status/sdk');
    const client = new PilotStatusClient({
      apiKey: env.MONITOR_STATUS_API_KEY,
    });
    await client.messages.send({
      templateId: env.AUTH_OTP_TEMPLATE_ID,
      destinationNumber: e164,
      /** Template Evo API Manager uses `{{codigo_otp}}` in Pilot Status. */
      variables: { codigo_otp: code },
    });
  } catch (e) {
    await redis.del(otpStoreKey(e164));
    await redis.del(cooldownKey(e164));
    const message = e instanceof Error ? e.message : String(e);
    logAuth('error', 'auth_otp_pilot_send_failed', { phone: maskE164(e164), message });
    return { ok: false, error: 'Could not send verification code', status: 502 };
  }

  const sent = await redis.incr(hourlyKey(e164));
  if (sent === 1) {
    await redis.expire(hourlyKey(e164), 3600);
  }

  logAuth('info', 'auth_otp_sent', { phone: maskE164(e164) });
  return { ok: true };
}
