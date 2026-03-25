'use client';

import { SessionProvider } from 'next-auth/react';

import { I18nProvider } from '@/components/i18n/i18n-provider';
import type { AppLocale } from '@/lib/i18n';

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: AppLocale;
}) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <SessionProvider>{children}</SessionProvider>
    </I18nProvider>
  );
}
