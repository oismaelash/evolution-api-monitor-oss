import { Suspense } from 'react';
import { LoginPageBody } from './login-page-body';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-text-muted)]">
          Loading…
        </div>
      }
    >
      <LoginPageBody />
    </Suspense>
  );
}
