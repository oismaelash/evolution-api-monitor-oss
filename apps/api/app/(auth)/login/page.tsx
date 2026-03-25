import { Suspense } from 'react';

import { LoginLoadingFallback } from '@/components/auth/login-loading-fallback';

import { LoginPageBody } from './login-page-body';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <LoginPageBody />
    </Suspense>
  );
}
