import { describe, expect, it, vi } from 'vitest';
import { getLocale, getServerTranslator } from './i18n-server.js';
import { MONITOR_LOCALE_COOKIE } from './i18n.js';

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockImplementation((name) => {
      if (name === MONITOR_LOCALE_COOKIE) {
        return { value: 'pt' };
      }
      return undefined;
    }),
  }),
}));

describe('i18n-server', () => {
  it('getLocale reads from cookies', async () => {
    const locale = await getLocale();
    expect(locale).toBe('pt');
  });

  it('getServerTranslator returns translator function', async () => {
    const t = await getServerTranslator();
    expect(t('pt', 'en')).toBe('pt');
  });
});
