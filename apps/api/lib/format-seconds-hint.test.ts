import { describe, expect, it, vi } from 'vitest';
import { formatSecondsAsHumanDuration, parseSecondsInput } from './format-seconds-hint.js';

describe('format-seconds-hint', () => {
  const t = vi.fn().mockImplementation((pt: string, _en: string) => pt);

  describe('formatSecondsAsHumanDuration', () => {
    it('formats seconds only', () => {
      expect(formatSecondsAsHumanDuration(45, t)).toBe('45 s');
    });

    it('formats minutes and seconds', () => {
      expect(formatSecondsAsHumanDuration(65, t)).toBe('1 min 5 s');
      expect(formatSecondsAsHumanDuration(120, t)).toBe('2 min');
    });

    it('formats hours and minutes', () => {
      expect(formatSecondsAsHumanDuration(3660, t)).toBe('1 h 1 min');
      expect(formatSecondsAsHumanDuration(3600, t)).toBe('1 h');
    });

    it('formats hours and seconds when minutes are zero', () => {
      expect(formatSecondsAsHumanDuration(3605, t)).toBe('1 h 5 s');
    });

    it('returns empty string for invalid input', () => {
      expect(formatSecondsAsHumanDuration(-10, t)).toBe('');
      expect(formatSecondsAsHumanDuration(NaN, t)).toBe('');
    });
  });

  describe('parseSecondsInput', () => {
    it('parses valid integer strings', () => {
      expect(parseSecondsInput('100')).toBe(100);
      expect(parseSecondsInput('  42  ')).toBe(42);
      expect(parseSecondsInput('0')).toBe(0);
    });

    it('returns null for empty or invalid strings', () => {
      expect(parseSecondsInput('')).toBeNull();
      expect(parseSecondsInput('  ')).toBeNull();
      expect(parseSecondsInput('abc')).toBeNull();
      expect(parseSecondsInput('12.5')).toBeNull(); // decimal not allowed by regex
      expect(parseSecondsInput('-5')).toBeNull(); // negative not allowed by regex
    });

    it('returns null for Infinity values that pass regex', () => {
      // Very large numbers that parse to Infinity
      expect(parseSecondsInput('1'.repeat(400))).toBeNull();
    });
  });
});
