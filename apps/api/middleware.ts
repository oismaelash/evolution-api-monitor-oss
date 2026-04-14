import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  getOssAccessCookieSecretFromProcessEnv,
  isOssAccessLockEnforcedFromProcessEnv,
  isOssAccessLockMisconfiguredFromProcessEnv,
} from '@monitor/shared/oss-access-process-env';

import { OSS_ACCESS_COOKIE_NAME, verifyOssAccessCookie } from '@/lib/oss-access-cookie';

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith('/api/access')) {
    return true;
  }
  if (pathname.startsWith('/api/webhooks')) {
    return true;
  }
  if (pathname === '/access' || pathname.startsWith('/access/')) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const pe = process.env as Record<string, string | undefined>;

  if (!isOssAccessLockEnforcedFromProcessEnv(pe)) {
    if (isOssAccessLockMisconfiguredFromProcessEnv(pe)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error:
              'Access lock is enabled but ENCRYPTION_KEY (64 hex) or NEXTAUTH_SECRET (32+ chars) is missing from the environment.',
            code: 'UNKNOWN',
          },
          { status: 503 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = '/access';
      url.searchParams.set('error', 'config');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const secret = getOssAccessCookieSecretFromProcessEnv(pe)!;
  const token = request.cookies.get(OSS_ACCESS_COOKIE_NAME)?.value;
  const ok = await verifyOssAccessCookie(secret, token);
  if (ok) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_ERROR' }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/access';
  url.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/projects/:path*',
    '/numbers/:path*',
    '/logs/:path*',
    '/onboarding/:path*',
    '/api/:path*',
  ],
};
