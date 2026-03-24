import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@monitor/database';
import { loadEnv, registerSchema, SubscriptionStatus } from '@monitor/shared';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const email = parsed.data.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const env = loadEnv();
    const u = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: parsed.data.name,
      },
    });
    if (env.CLOUD_BILLING) {
      await prisma.subscription.create({
        data: {
          userId: u.id,
          status: SubscriptionStatus.TRIALING as never,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
