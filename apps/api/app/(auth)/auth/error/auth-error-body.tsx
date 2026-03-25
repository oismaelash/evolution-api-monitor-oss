'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const HINTS: Record<string, string> = {
  OAuthSignin:
    'Could not start the sign-in request with the provider. Check client ID and secret in your environment.',
  OAuthCallback:
    'The provider rejected the callback. Common fixes: set NEXTAUTH_URL to the exact origin you use in the browser (e.g. http://localhost:3000, not 127.0.0.1 if you use localhost). In Google Cloud Console, add Authorized redirect URI: {origin}/api/auth/callback/google',
  OAuthCreateAccount: 'Could not create OAuth account in the database.',
  EmailSignin: 'The email sign-in link could not be sent.',
  CredentialsSignin: 'Invalid credentials.',
  AccessDenied: 'Sign-in was denied (for example, no email on the account or sign-in callback rejected the user).',
  SessionRequired: 'You must be signed in to view this page.',
  Configuration:
    'NextAuth configuration error. Check NEXTAUTH_SECRET and provider environment variables.',
  Default: 'An unexpected authentication error occurred.',
};

export function AuthErrorBody() {
  const searchParams = useSearchParams();
  const code = searchParams.get('error') ?? 'Default';
  const hint = HINTS[code] ?? HINTS.Default;
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const hintResolved = hint.replaceAll('{origin}', origin);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Sign-in error
        </h1>
        <p className="mt-2 font-mono text-sm text-[var(--color-text-muted)]">{code}</p>
        <p className="mt-4 text-sm text-[var(--color-text-primary)]">{hintResolved}</p>
        <div className="mt-8 flex flex-col gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-center font-medium text-white"
          >
            Back to sign in
          </Link>
          <Link
            href="/"
            className="text-center text-[var(--color-accent)] hover:underline"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
