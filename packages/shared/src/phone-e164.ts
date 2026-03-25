import { z } from 'zod';

/** E.164: + and 10–15 digits total (after +). */
export const E164_PHONE_REGEX = /^\+\d{10,15}$/;

/** Build E.164: +DDI + national digits (no spaces). */
export function buildE164FromDdiAndNumber(ddiRaw: string, nationalRaw: string): string {
  const ddi = ddiRaw.replace(/\D/g, '');
  const national = nationalRaw.replace(/\D/g, '');
  if (!ddi || !national) {
    return '';
  }
  return `+${ddi}${national}`;
}

export function isValidE164(phone: string): boolean {
  return E164_PHONE_REGEX.test(phone);
}

/**
 * Interprets DDI + national fields: empty, incomplete (only one side), invalid E.164, or the composed value.
 */
export function composedE164FromDdiFields(
  ddiRaw: string,
  nationalRaw: string,
): 'empty' | 'partial' | 'invalid' | string {
  const ddiDigits = ddiRaw.replace(/\D/g, '');
  const natDigits = nationalRaw.replace(/\D/g, '');
  const hasAny = ddiDigits.length > 0 || natDigits.length > 0;
  const hasBoth = ddiDigits.length > 0 && natDigits.length > 0;
  if (!hasAny) {
    return 'empty';
  }
  if (!hasBoth) {
    return 'partial';
  }
  const composed = buildE164FromDdiAndNumber(ddiRaw, nationalRaw);
  if (!isValidE164(composed)) {
    return 'invalid';
  }
  return composed;
}

export const e164PhoneSchema = z
  .string()
  .trim()
  .regex(E164_PHONE_REGEX, 'Invalid E.164 phone');
