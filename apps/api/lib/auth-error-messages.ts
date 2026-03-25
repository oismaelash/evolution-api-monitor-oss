/** NextAuth error query values — see next-auth/core/index.js (error action) */
export const AUTH_ERROR_HINTS: Record<string, string> = {
  OAuthSignin:
    'Could not start sign-in with the provider. Check client ID and secret in your environment.',
  OAuthCallback:
    'OAuth callback failed. Set NEXTAUTH_URL to the exact origin you use (e.g. http://localhost:3000). In Google Cloud, add redirect URI: {origin}/api/auth/callback/google',
  OAuthCreateAccount: 'Could not create the user account after OAuth.',
  OAuthAccountNotLinked:
    'This OAuth account is not linked to an existing user.',
  EmailSignin: 'The email sign-in link could not be sent.',
  CredentialsSignin: 'Invalid credentials.',
  AccessDenied:
    'Sign-in was denied (for example, no email on the account or the sign-in callback rejected the user).',
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
