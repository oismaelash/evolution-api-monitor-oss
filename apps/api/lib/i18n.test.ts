import { describe, expect, it } from 'vitest';
import { parseLocale, pickLocale } from './i18n.js';

describe('i18n', () => {
  describe('parseLocale', () => {
    it('returns pt when value is pt', () => {
      expect(parseLocale('pt')).toBe('pt');
    });

    it('returns en when value is en', () => {
      expect(parseLocale('en')).toBe('en');
    });

    it('returns en for unknown or undefined values', () => {
      expect(parseLocale('fr')).toBe('en');
      expect(parseLocale(undefined)).toBe('en');
      expect(parseLocale('')).toBe('en');
    });
  });

  describe('pickLocale', () => {
    it('returns pt string when locale is pt', () => {
      expect(pickLocale('pt', 'olá', 'hello')).toBe('olá');
    });

    it('returns en string when locale is en', () => {
      expect(pickLocale('en', 'olá', 'hello')).toBe('hello');
    });
  });
});
