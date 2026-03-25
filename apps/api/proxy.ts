import authMiddleware from 'next-auth/middleware';

/** Next.js 16+ uses `proxy.ts` (formerly `middleware.ts`). Re-export next-auth as default so the bundler sees a concrete function export. */
export default authMiddleware;

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/numbers/:path*',
    '/logs/:path*',
    '/settings/:path*',
  ],
};
