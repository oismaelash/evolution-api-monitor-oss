export type AppLocale = 'pt' | 'en';

export const MONITOR_LOCALE_COOKIE = 'MONITOR_LOCALE';

export const DEFAULT_LOCALE: AppLocale = 'en';

export function parseLocale(value: string | undefined): AppLocale {
  if (value === 'pt') {
    return 'pt';
  }
  return 'en';
}

export function pickLocale(locale: AppLocale, pt: string, en: string): string {
  return locale === 'pt' ? pt : en;
}

export type Translator = (pt: string, en: string) => string;
