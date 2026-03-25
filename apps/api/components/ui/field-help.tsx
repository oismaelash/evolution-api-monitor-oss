'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MessageQuestion } from 'iconsax-react';
import { useT } from '@/components/i18n/i18n-provider';

export type FieldHelpProps = {
  description: string;
  example: string;
};

/**
 * Question-mark control with description + example (toggle on click; closes on outside click or Escape).
 */
export function FieldHelp({ description, example }: FieldHelpProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const srTextId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-flex shrink-0">
      <span id={srTextId} className="sr-only">
        {description} {t('Exemplo', 'Example')}: {example}
      </span>
      <button
        type="button"
        className="rounded p-0.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
        aria-expanded={open}
        aria-controls={panelId}
        aria-describedby={srTextId}
        onClick={() => setOpen((v) => !v)}
        title={t('Ajuda', 'Help')}
      >
        <MessageQuestion size={16} variant="Linear" color="currentColor" aria-hidden />
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          className="absolute right-0 top-full z-50 mt-1 w-72 max-w-[min(18rem,calc(100vw-1.5rem))] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left shadow-lg"
        >
          <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">{description}</p>
          <p className="mt-2 text-xs text-[var(--color-text-primary)]">
            <span className="font-semibold text-[var(--color-text-primary)]">
              {t('Exemplo', 'Example')}
              {': '}
            </span>
            {example}
          </p>
        </div>
      ) : null}
    </div>
  );
}

type FormLabelWithHelpProps = {
  htmlFor?: string;
  children: React.ReactNode;
  description: string;
  example: string;
};

/**
 * Label + optional `htmlFor` + help icon row (use for inputs, selects, textareas).
 */
export function FormLabelWithHelp({ htmlFor, children, description, example }: FormLabelWithHelpProps) {
  const labelClass =
    'flex-1 min-w-0 text-sm font-medium leading-snug text-[var(--color-text-muted)]';
  return (
    <div className="mb-1 flex items-start gap-1.5">
      {htmlFor !== undefined ? (
        <label htmlFor={htmlFor} className={labelClass}>
          {children}
        </label>
      ) : (
        <span className={labelClass}>{children}</span>
      )}
      <FieldHelp description={description} example={example} />
    </div>
  );
}
