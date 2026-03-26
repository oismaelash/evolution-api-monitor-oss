import { describe, it, expect } from 'vitest';
import { buildE164FromDdiAndNumber, isValidE164, composedE164FromDdiFields, e164PhoneSchema } from './phone-e164.js';

describe('phone-e164', () => {
  it('buildE164FromDdiAndNumber should strip non-digits and format', () => {
    expect(buildE164FromDdiAndNumber('55', '11999999999')).toBe('+5511999999999');
    expect(buildE164FromDdiAndNumber('+55', '(11) 99999-9999')).toBe('+5511999999999');
    expect(buildE164FromDdiAndNumber('', '11999999999')).toBe('');
    expect(buildE164FromDdiAndNumber('55', '')).toBe('');
  });

  it('isValidE164 should validate length and prefix', () => {
    expect(isValidE164('+5511999999999')).toBe(true);
    expect(isValidE164('+123456789')).toBe(false); // 9 digits (needs 10-15)
    expect(isValidE164('+1234567890')).toBe(true); // 10 digits
    expect(isValidE164('+123456789012345')).toBe(true); // 15 digits
    expect(isValidE164('+1234567890123456')).toBe(false); // 16 digits
    expect(isValidE164('5511999999999')).toBe(false); // missing +
  });

  it('composedE164FromDdiFields should return statuses', () => {
    expect(composedE164FromDdiFields('', '')).toBe('empty');
    expect(composedE164FromDdiFields('+', '')).toBe('empty');
    expect(composedE164FromDdiFields('55', '')).toBe('partial');
    expect(composedE164FromDdiFields('', '1199')).toBe('partial');
    expect(composedE164FromDdiFields('55', '11')).toBe('invalid'); // +5511 is 4 digits
    expect(composedE164FromDdiFields('55', '11999999999')).toBe('+5511999999999');
  });

  it('e164PhoneSchema should validate via zod', () => {
    expect(e164PhoneSchema.safeParse('+5511999999999').success).toBe(true);
    expect(e164PhoneSchema.safeParse('  +5511999999999  ').success).toBe(true); // trim works
    expect(e164PhoneSchema.safeParse('5511999999999').success).toBe(false);
  });
});
