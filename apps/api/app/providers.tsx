'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

import { I18nProvider } from '@/components/i18n/i18n-provider';
import type { AppLocale } from '@/lib/i18n';

function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider> & { children: React.ReactNode }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: AppLocale;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <I18nProvider initialLocale={initialLocale}>
        {children}
      </I18nProvider>
    </ThemeProvider>
  );
}
