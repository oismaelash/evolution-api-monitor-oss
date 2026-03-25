'use client';

import { createContext, useContext, useMemo } from 'react';

import type { AppLocale, Translator } from '@/lib/i18n';
import { pickLocale } from '@/lib/i18n';

const I18nContext = createContext<AppLocale | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: AppLocale;
  children: React.ReactNode;
}) {
  const value = useMemo(() => initialLocale, [initialLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale(): AppLocale {
  const locale = useContext(I18nContext);
  if (locale === null) {
    throw new Error('useLocale must be used within I18nProvider');
  }
  return locale;
}

export function useT(): Translator {
  const locale = useLocale();
  return useMemo(() => (pt: string, en: string) => pickLocale(locale, pt, en), [locale]);
}
