import { describe, expect, it } from 'vitest';
import { e164ToDdiAndNational } from './e164-fields.js';

describe('e164ToDdiAndNational', () => {
  it('returns empty for null or undefined', () => {
    expect(e164ToDdiAndNational(null)).toEqual({ ddi: '', national: '' });
    expect(e164ToDdiAndNational(undefined)).toEqual({ ddi: '', national: '' });
    expect(e164ToDdiAndNational('')).toEqual({ ddi: '', national: '' });
  });

  it('splits valid E.164 phone numbers', () => {
    expect(e164ToDdiAndNational('+5511999999999')).toEqual({ ddi: '55', national: '11999999999' });
    expect(e164ToDdiAndNational('+12125551234')).toEqual({ ddi: '1', national: '2125551234' });
  });

  it('handles numbers missing the + prefix as national-only', () => {
    expect(e164ToDdiAndNational('5511999999999')).toEqual({ ddi: '', national: '5511999999999' });
    expect(e164ToDdiAndNational('abc123def456')).toEqual({ ddi: '', national: '123456' });
  });

  it('handles invalid numbers starting with + as national-only', () => {
    // libphonenumber-js won't parse this successfully
    expect(e164ToDdiAndNational('+999')).toEqual({ ddi: '', national: '999' });
  });
});
