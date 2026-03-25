import { cookies } from 'next/headers';

import {
  MONITOR_LOCALE_COOKIE,
  parseLocale,
  pickLocale,
  type AppLocale,
  type Translator,
} from './i18n';

export async function getLocale(): Promise<AppLocale> {
  const store = await cookies();
  return parseLocale(store.get(MONITOR_LOCALE_COOKIE)?.value);
}

export async function getServerTranslator(): Promise<Translator> {
  const locale = await getLocale();
  return (pt: string, en: string) => pickLocale(locale, pt, en);
}
