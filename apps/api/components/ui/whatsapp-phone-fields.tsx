'use client';

import { useT } from '@/components/i18n/i18n-provider';
import { FieldHelp } from '@/components/ui/field-help';

export type WhatsappPhoneFieldsProps = {
  ddiId: string;
  nationalId: string;
  ddiValue: string;
  nationalValue: string;
  onDdiChange: (value: string) => void;
  onNationalChange: (value: string) => void;
  /** Same helper line as login (format +DDI + number). */
  showFormatHint?: boolean;
  /** Show help icons for DDI and national fields (project connection / alert phone). */
  perFieldHelp?: boolean;
};

/**
 * DDI + national number inputs, aligned with the WhatsApp OTP login step.
 * Parent composes E.164 with `buildE164FromDdiAndNumber` from `@monitor/shared`.
 */
export function WhatsappPhoneFields({
  ddiId,
  nationalId,
  ddiValue,
  nationalValue,
  onDdiChange,
  onNationalChange,
  showFormatHint = true,
  perFieldHelp = false,
}: WhatsappPhoneFieldsProps) {
  const t = useT();

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[7rem]">
          <div className="flex items-start gap-1">
            {perFieldHelp ? (
              <FieldHelp
                description={t(
                  'Código do país sem o + (apenas dígitos). Junto com o número forma o E.164 usado no WhatsApp de alerta.',
                  'Country calling code without + (digits only). Together with the national number it forms the E.164 alert WhatsApp.',
                )}
                example={t('55 para Brasil', '55 for Brazil')}
              />
            ) : null}
            <label
              htmlFor={ddiId}
              className="flex-1 text-xs font-medium leading-snug text-[var(--color-text-muted)]"
            >
              {t('DDI', 'Country code')}
            </label>
          </div>
          <input
            id={ddiId}
            type="text"
            name="ddi"
            inputMode="numeric"
            autoComplete="tel-country-code"
            placeholder={t('ex.: 55', 'e.g. 55')}
            value={ddiValue}
            onChange={(e) => onDdiChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start gap-1">
            {perFieldHelp ? (
              <FieldHelp
                description={t(
                  'Número local sem DDI e sem +. Será combinado com o DDI para formar +5511999999999 (E.164).',
                  'Local number without country code or +. Combined with DDI to build +5511999999999 (E.164).',
                )}
                example={t('11999999999 (SP, celular)', '11999999999 (mobile, São Paulo)')}
              />
            ) : null}
            <label
              htmlFor={nationalId}
              className="flex-1 text-xs font-medium leading-snug text-[var(--color-text-muted)]"
            >
              {t('Número', 'Number')}
            </label>
          </div>
          <input
            id={nationalId}
            type="tel"
            name="phone"
            autoComplete="tel-national"
            placeholder={t('ex.: 11999999999', 'e.g. 11999999999')}
            value={nationalValue}
            onChange={(e) =>
              onNationalChange(e.target.value.replace(/\D/g, '').slice(0, 15))
            }
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>
      </div>
      {showFormatHint ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          {t(
            'Será usado o formato +DDI seguido do número, sem espaços.',
            'The app will use +country code followed by the number, no spaces.',
          )}
        </p>
      ) : null}
    </div>
  );
}
