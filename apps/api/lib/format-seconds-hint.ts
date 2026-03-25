import type { Translator } from '@/lib/i18n';

/**
 * Human-readable duration for a second count (hint beside numeric "seconds" inputs).
 */
export function formatSecondsAsHumanDuration(totalSeconds: number, t: Translator): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '';
  }
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const hLabel = t('h', 'h');
  const minLabel = t('min', 'min');
  const sLabel = t('s', 's');

  if (h > 0) {
    const parts: string[] = [`${h} ${hLabel}`];
    if (m > 0) {
      parts.push(`${m} ${minLabel}`);
    } else if (sec > 0) {
      parts.push(`${sec} ${sLabel}`);
    }
    return parts.join(' ');
  }
  if (m > 0) {
    return sec > 0 ? `${m} ${minLabel} ${sec} ${sLabel}` : `${m} ${minLabel}`;
  }
  return `${sec} ${sLabel}`;
}

/**
 * Parses a string from a controlled input; returns null if not a valid non-negative integer.
 */
export function parseSecondsInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return n;
}
