'use client';

import { formatSecondsAsHumanDuration, parseSecondsInput } from '@/lib/format-seconds-hint';
import { useT } from '@/components/i18n/i18n-provider';

const hintClass =
  'shrink-0 text-xs text-[var(--color-text-muted)] tabular-nums whitespace-nowrap';

/**
 * Live hint next to a seconds field: shows equivalent in min/h (and s when needed).
 */
export function SecondsInputHint({ value }: { value: string }) {
  const t = useT();
  const n = parseSecondsInput(value);
  const text = n === null ? '' : formatSecondsAsHumanDuration(n, t);
  if (text === '') {
    return null;
  }
  return (
    <span className={hintClass} aria-live="polite">
      ≈ {text}
    </span>
  );
}
