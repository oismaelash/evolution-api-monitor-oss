import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Split a stored E.164 value into DDI + national digits for the WhatsApp phone fields.
 * Falls back to national-only if parsing fails (legacy or malformed DB value).
 */
export function e164ToDdiAndNational(e164: string | null | undefined): { ddi: string; national: string } {
  if (!e164 || typeof e164 !== 'string') {
    return { ddi: '', national: '' };
  }
  const trimmed = e164.trim();
  if (!trimmed.startsWith('+')) {
    return { ddi: '', national: trimmed.replace(/\D/g, '').slice(0, 15) };
  }
  const p = parsePhoneNumberFromString(trimmed);
  if (p?.isValid()) {
    return { ddi: String(p.countryCallingCode), national: p.nationalNumber };
  }
  const digits = trimmed.replace(/\D/g, '');
  return { ddi: '', national: digits.slice(0, 15) };
}
