import { NextResponse } from 'next/server';

import { ossAccessVerifySchema } from '@monitor/shared';

import { OSS_ACCESS_COOKIE_NAME, OSS_ACCESS_COOKIE_MAX_AGE_SEC } from '@/lib/oss-access-cookie';
import { toErrorResponse } from '@/lib/http';
import { AccessLockService } from '@/services/access-lock.service';

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsed = ossAccessVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const token = await AccessLockService.verifyAndSignCookie(parsed.data.password);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(OSS_ACCESS_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: OSS_ACCESS_COOKIE_MAX_AGE_SEC,
    });
    return res;
  } catch (e) {
    return toErrorResponse(e);
  }
}
