'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MessageQuestion } from 'iconsax-react';
import { useT } from '@/components/i18n/i18n-provider';

export type FieldHelpProps = {
  description: string;
  /** Current value reflected in the help panel (use {@link maskSecretInput} for password fields). */
  value: string;
};

/** Mask for password/secret fields — length preserved up to 32 bullets, no plaintext. */
export function maskSecretInput(raw: string): string {
  if (raw.length === 0) return '';
  return '•'.repeat(Math.min(raw.length, 32));
}

/**
 * Question-mark control: tooltip on hover (and on click for touch / pin).
 */
export function FieldHelp({ description, value }: FieldHelpProps) {
  const t = useT();
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const srTextId = useId();

  const show = hover || pinned;
  const emptyLabel = t('(vazio)', '(empty)');
  const displayValue = value.trim() === '' ? emptyLabel : value;

  useEffect(() => {
    if (!pinned) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setPinned(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPinned(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [pinned]);

  return (
    <div
      ref={wrapRef}
      className={`relative inline-flex shrink-0 ${show ? 'z-[99999]' : 'z-10'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span id={srTextId} className="sr-only">
        {description} {t('Valor no campo', 'Value in field')}: {displayValue}
      </span>
      <button
        type="button"
        className="rounded p-0.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
        aria-expanded={show}
        aria-controls={panelId}
        aria-describedby={srTextId}
        title={t('Ajuda', 'Help')}
        onClick={() => setPinned((v) => !v)}
      >
        <MessageQuestion size={16} variant="Linear" color="currentColor" aria-hidden />
      </button>
      {show ? (
        <div
          id={panelId}
          role="region"
          className="absolute right-0 top-full z-[99999] pt-1"
        >
          {/* pt-1 bridges button → panel so hover is not lost in the gap */}
          <div className="w-72 max-w-[min(18rem,calc(100vw-1.5rem))] rounded-md border border-[var(--color-border)] bg-white dark:bg-[#18181b] p-3 text-left shadow-lg">
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">{description}</p>
            <p className="mt-2 text-xs text-[var(--color-text-primary)]">
              <span className="font-semibold text-[var(--color-text-primary)]">
                {t('Valor no campo', 'Value in field')}
                {': '}
              </span>
              <span className="break-words whitespace-pre-wrap font-mono text-[var(--color-text-primary)]">
                {displayValue}
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type FormLabelWithHelpProps = {
  htmlFor?: string;
  children: React.ReactNode;
  description: string;
  value: string;
};

/**
 * Label + help icon immediately after the title (not pushed to the row end).
 */
export function FormLabelWithHelp({
  htmlFor,
  children,
  description,
  value,
}: FormLabelWithHelpProps) {
  const labelClass =
    'text-sm font-medium leading-snug text-[var(--color-text-muted)]';
  return (
    <div className="mb-1">
      <span className="inline-flex max-w-full items-start gap-1.5">
        {htmlFor !== undefined ? (
          <label htmlFor={htmlFor} className={labelClass}>
            {children}
          </label>
        ) : (
          <span className={labelClass}>{children}</span>
        )}
        <FieldHelp description={description} value={value} />
      </span>
    </div>
  );
}
