import { NextRequest, NextResponse } from 'next/server';

import { whatsappOtpRequestSchema } from '@monitor/shared';

import { requestWhatsappOtp } from '@/services/whatsapp-otp-auth.service';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = whatsappOtpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await requestWhatsappOtp(parsed.data.phone);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
