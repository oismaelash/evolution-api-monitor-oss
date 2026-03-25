'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
        <h1 className="mb-2 text-xl font-semibold">Sign in</h1>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          Use your Google or GitHub account to access the dashboard.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]"
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]"
          >
            Continue with GitHub
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          <Link href="/" className="text-[var(--color-accent)] hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
