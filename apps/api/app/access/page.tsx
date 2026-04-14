import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getOssAccessCookieSecretFromProcessEnv } from '@monitor/shared';

import { AccessGateForm } from '@/components/access/access-gate-form';
import { OSS_ACCESS_COOKIE_NAME, verifyOssAccessCookie } from '@/lib/oss-access-cookie';
import { AccessLockService } from '@/services/access-lock.service';

function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/dashboard';
  }
  return next;
}

type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function AccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const destination = safeNext(sp.next);
  const status = await AccessLockService.getStatus();

  if (!status.lockEnforced && !status.misconfigured) {
    redirect(destination);
  }

  const secret = getOssAccessCookieSecretFromProcessEnv();
  if (secret) {
    const token = (await cookies()).get(OSS_ACCESS_COOKIE_NAME)?.value;
    if (token && (await verifyOssAccessCookie(secret, token))) {
      redirect(destination);
    }
  }

  const showConfigError = sp.error === 'config' || status.misconfigured;

  let mode: 'env' | 'setup' | 'login';
  if (status.useEnvPassword) {
    mode = 'env';
  } else if (status.needsSetup) {
    mode = 'setup';
  } else {
    mode = 'login';
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-lg backdrop-blur-md">
        <AccessGateForm mode={mode} showConfigError={showConfigError} nextPath={destination} />
      </div>
    </div>
  );
}
