'use client';

import { useT } from '@/components/i18n/i18n-provider';
import { FieldHelp } from '@/components/ui/field-help';
import { WhatsappPhoneFields } from '@/components/ui/whatsapp-phone-fields';

export type ProjectAlertPhoneSectionProps = {
  ddiId: string;
  nationalId: string;
  ddiValue: string;
  nationalValue: string;
  onDdiChange: (value: string) => void;
  onNationalChange: (value: string) => void;
  /** New project: phone is optional; label copy reflects that. */
  optional?: boolean;
};

export function ProjectAlertPhoneSection({
  ddiId,
  nationalId,
  ddiValue,
  nationalValue,
  onDdiChange,
  onNationalChange,
  optional = false,
}: ProjectAlertPhoneSectionProps) {
  const t = useT();
  const preview =
    ddiValue.length > 0 || nationalValue.length > 0 ? `+${ddiValue}${nationalValue}` : '';

  const title = optional
    ? t('Telefone de alerta (opcional)', 'Alert phone (optional)')
    : t('Telefone de alerta', 'Alert phone');

  const description = optional
    ? t(
        'DDI e número em campos separados (mesmo formato do login com WhatsApp). Em E.164 para o canal Monitor Status. Pode configurar depois.',
        'Country code and number in separate fields (same as WhatsApp login). E.164 for Monitor Status. You can set this later.',
      )
    : t(
        'DDI e número em campos separados (mesmo formato do login com WhatsApp). Destino em E.164 para alertas do Monitor Status.',
        'Country code and number in separate fields (same as WhatsApp login). E.164 destination for Monitor Status alerts.',
      );

  return (
    <fieldset className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-4">
      <legend className="w-full px-0.5 pb-3 text-left">
        <span className="inline-flex max-w-full items-start gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">{title}</span>
          <FieldHelp description={description} value={preview} />
        </span>
      </legend>
      <WhatsappPhoneFields
        ddiId={ddiId}
        nationalId={nationalId}
        ddiValue={ddiValue}
        nationalValue={nationalValue}
        onDdiChange={onDdiChange}
        onNationalChange={onNationalChange}
        perFieldHelp
        showFormatHint
      />
    </fieldset>
  );
}
