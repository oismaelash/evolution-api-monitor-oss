'use client';

import { EvolutionFlavor, type EvolutionFlavor as EvolutionFlavorType } from '@monitor/shared';
import { useT } from '@/components/i18n/i18n-provider';

const fieldId = (suffix: string) => `evolution-flavor-${suffix}`;

export function EvolutionFlavorFields({
  idSuffix = 'default',
  flavor,
  onFlavorChange,
}: {
  idSuffix?: string;
  flavor: EvolutionFlavorType;
  onFlavorChange: (value: EvolutionFlavorType) => void;
}) {
  const t = useT();
  const groupName = `evolution-flavor-${idSuffix}`;
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-[var(--color-text-primary)]">
        {t('Tipo de servidor Evolution', 'Evolution server type')}
      </legend>
      <p className="text-sm text-[var(--color-text-muted)]">
        {t(
          'Escolha a linha do produto instalada no seu servidor. Evolution Go usa outra API; alertas disparam na primeira falha de conexão (sem reinício automático).',
          'Choose which Evolution product line your server runs. Evolution Go uses a different API; alerts fire on the first connection failure (no automatic restart).',
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
            checked={flavor === EvolutionFlavor.EVOLUTION_V2}
            onChange={() => onFlavorChange(EvolutionFlavor.EVOLUTION_V2)}
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
          className="flex cursor-pointer items-start gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5"
        >
          <input
            id={fieldId(`${idSuffix}-go`)}
            type="radio"
            name={groupName}
            value={EvolutionFlavor.EVOLUTION_GO}
            checked={flavor === EvolutionFlavor.EVOLUTION_GO}
            onChange={() => onFlavorChange(EvolutionFlavor.EVOLUTION_GO)}
            className="mt-0.5"
          />
          <span>
            <span className="block text-sm font-medium text-[var(--color-text-primary)]">
              {t('Evolution Go', 'Evolution Go')}
            </span>
            <span className="block text-xs text-[var(--color-text-muted)]">
              {t(
                'Implementação Go (documentação Evolution Foundation).',
                'Go implementation (Evolution Foundation docs).',
              )}
            </span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
