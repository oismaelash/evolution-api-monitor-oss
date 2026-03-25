/** NextAuth error query values — see next-auth/core/index.js (error action) */
export const AUTH_ERROR_HINTS: Record<string, string> = {
  OAuthSignin:
    'Could not start sign-in with the provider. Check client ID and secret in your environment.',
  OAuthCallback:
    'OAuth callback failed. Use the same host as NEXTAUTH_URL (prefer http://localhost:3000, not 127.0.0.1). Ensure NEXTAUTH_URL uses http:// when you browse over HTTP (Secure cookies are skipped on plain HTTP). In Google Cloud, add redirect URI: {origin}/api/auth/callback/google',
  OAuthCreateAccount: 'Could not create the user account after OAuth.',
  OAuthAccountNotLinked:
    'This OAuth account is not linked to an existing user.',
  EmailSignin: 'The email sign-in link could not be sent.',
  CredentialsSignin: 'Invalid credentials.',
  AccessDenied:
    'Sign-in was denied (missing email, callback rejected the user, or database not migrated). If the project is new, run: npm run db:migrate:deploy',
  SessionRequired: 'You must be signed in to view this page.',
  Configuration:
    'Server configuration problem. Check NEXTAUTH_SECRET and OAuth environment variables.',
  Callback: 'An error occurred during the OAuth callback.',
  Verification: 'The sign-in link is invalid or expired.',
  Default: 'Sign-in failed. Check the server logs for details.',
};

export function normalizeAuthErrorParam(raw: string | null): string | null {
  if (raw === null || raw === '' || raw === 'undefined') return null;
  return raw;
}
