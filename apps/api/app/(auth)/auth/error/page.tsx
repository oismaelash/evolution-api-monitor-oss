import { Suspense } from 'react';
import { AuthErrorBody } from './auth-error-body';

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-text-muted)]">
          Loading…
        </div>
      }
    >
      <AuthErrorBody />
    </Suspense>
  );
}
