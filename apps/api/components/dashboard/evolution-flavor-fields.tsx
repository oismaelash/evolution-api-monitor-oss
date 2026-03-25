'use client';

import { EvolutionFlavor, type EvolutionFlavor as EvolutionFlavorType } from '@monitor/shared';
import { useT } from '@/components/i18n/i18n-provider';

const fieldId = (suffix: string) => `evolution-flavor-${suffix}`;

export function EvolutionFlavorFields({
  idSuffix = 'default',
  initialFlavor = EvolutionFlavor.EVOLUTION_V2,
}: {
  idSuffix?: string;
  initialFlavor?: EvolutionFlavorType;
}) {
  const t = useT();
  const groupName = `evolution-flavor-${idSuffix}`;
  const v2Checked = initialFlavor === EvolutionFlavor.EVOLUTION_V2;
  const goChecked = initialFlavor === EvolutionFlavor.EVOLUTION_GO;
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-[var(--color-text-primary)]">
        {t('Tipo de servidor Evolution', 'Evolution server type')}
      </legend>
      <p className="text-sm text-[var(--color-text-muted)]">
        {t(
          'Escolha a linha do produto instalada no seu servidor. Só Evolution API v2 é suportada por enquanto.',
          'Choose which Evolution product line your server runs. Only Evolution API v2 is supported for now.',
        )}
      </p>
      <div className="space-y-2">
        <label
          htmlFor={fieldId(`${idSuffix}-v2`)}
          className="flex cursor-pointer items-start gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5"
        >
          <input
            id={fieldId(`${idSuffix}-v2`)}
            type="radio"
            name={groupName}
            value={EvolutionFlavor.EVOLUTION_V2}
            defaultChecked={v2Checked}
            className="mt-0.5"
          />
          <span>
            <span className="block text-sm font-medium text-[var(--color-text-primary)]">
              {t('Evolution API v2', 'Evolution API v2')}
            </span>
            <span className="block text-xs text-[var(--color-text-muted)]">
              {t(
                'Stack Node.js (Evolution API).',
                'Node.js stack (Evolution API).',
              )}
            </span>
          </span>
        </label>
        <label
          htmlFor={fieldId(`${idSuffix}-go`)}
          className="flex cursor-not-allowed items-start gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 opacity-60"
          title={t('Em breve', 'Coming soon')}
        >
          <input
            id={fieldId(`${idSuffix}-go`)}
            type="radio"
            name={groupName}
            value={EvolutionFlavor.EVOLUTION_GO}
            defaultChecked={goChecked}
            disabled
            className="mt-0.5"
          />
          <span>
            <span className="block text-sm font-medium text-[var(--color-text-primary)]">
              {t('Evolution Go', 'Evolution Go')}
            </span>
            <span className="block text-xs text-[var(--color-text-muted)]">
              {t('Disponível em breve.', 'Coming soon.')}
            </span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
