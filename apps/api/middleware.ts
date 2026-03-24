export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/numbers/:path*',
    '/logs/:path*',
    '/settings/:path*',
  ],
};
