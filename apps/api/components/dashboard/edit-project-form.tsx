'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  composedE164FromDdiFields,
  updateProjectSchema,
  type EvolutionFlavor as EvolutionFlavorType,
} from '@monitor/shared';
import { useT } from '@/components/i18n/i18n-provider';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';
import { ProjectAlertPhoneSection } from '@/components/dashboard/project-alert-phone-section';
import { formatZodIssues } from '@/lib/zod-validation-i18n';
import { FormLabelWithHelp, maskSecretInput } from '@/components/ui/field-help';
import { EvolutionFlavorFields } from '@/components/dashboard/evolution-flavor-fields';

const inputClass =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/70';

export function EditProjectForm({
  projectId,
  initialName,
  initialEvolutionUrl,
  initialEvolutionFlavor,
  initialAlertDdi,
  initialAlertNational,
}: {
  projectId: string;
  initialName: string;
  initialEvolutionUrl: string;
  initialEvolutionFlavor: EvolutionFlavorType;
  initialAlertDdi: string;
  initialAlertNational: string;
}) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [name, setName] = useState(initialName);
  const [evolutionUrl, setEvolutionUrl] = useState(initialEvolutionUrl);
  const [evolutionApiKey, setEvolutionApiKey] = useState('');
  const [alertDdi, setAlertDdi] = useState(initialAlertDdi);
  const [alertNational, setAlertNational] = useState(initialAlertNational);
  const [evolutionFlavor, setEvolutionFlavor] = useState(initialEvolutionFlavor);

  useEffect(() => {
    setAlertDdi(initialAlertDdi);
    setAlertNational(initialAlertNational);
  }, [initialAlertDdi, initialAlertNational]);

  useEffect(() => {
    setEvolutionFlavor(initialEvolutionFlavor);
  }, [initialEvolutionFlavor]);

  const [step, setStep] = useState(1);

  async function handleNextStep() {
    setMsg(null);
    if (step === 1) {
      if (!name.trim()) {
        setMsg(t('Nome é obrigatório', 'Name is required'));
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!evolutionUrl.trim()) {
        setMsg(t('URL é obrigatória', 'URL is required'));
        return;
      }
      try {
        new URL(evolutionUrl);
      } catch {
        setMsg(t('URL inválida', 'Invalid URL'));
        return;
      }
      setStep(3);
    }
  }

  function handlePrevStep() {
    setMsg(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setOk(null);
    const alertResult = composedE164FromDdiFields(alertDdi, alertNational);
    if (alertResult === 'partial') {
      setMsg(
        t(
          'Indique DDI e número no telefone de alerta, ou deixe os dois em branco.',
          'Enter both country code and number for the alert phone, or leave both empty.',
        ),
      );
      return;
    }
    if (alertResult === 'invalid') {
      setMsg(
        t(
          'Telefone de alerta inválido (E.164: + e 10 a 15 dígitos no total).',
          'Invalid alert phone (E.164: + and 10–15 digits total).',
        ),
      );
      return;
    }
    const body: Record<string, unknown> = {
      name: name.trim(),
      evolutionFlavor,
      evolutionUrl: evolutionUrl.trim(),
      alertPhone: alertResult === 'empty' ? null : alertResult,
    };
    const key = evolutionApiKey.trim();
    if (key.length > 0) {
      body.evolutionApiKey = key;
    }
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      setMsg(formatZodIssues(parsed.error.issues, t));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(apiErrorMessage(data, t));
        return;
      }
      setEvolutionApiKey('');
      setOk(t('Salvo.', 'Saved.'));
      setStep(1); // Reset wizard back to step 1 after successful save
      router.refresh();
    } catch {
      setMsg(t('Erro de rede', 'Network error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 3) void onSubmit(e);
        else handleNextStep();
      }} 
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {step === 1 && t('Passo 1: Dados Iniciais', 'Step 1: Base Data')}
          {step === 2 && t('Passo 2: Credenciais', 'Step 2: Credentials')}
          {step === 3 && t('Passo 3: Alertas', 'Step 3: Alerts')}
        </p>
        <div className="flex gap-1">
          <div className={`h-2 w-6 rounded-full ${step >= 1 ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />
          <div className={`h-2 w-6 rounded-full transition-colors ${step >= 2 ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />
          <div className={`h-2 w-6 rounded-full transition-colors ${step >= 3 ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {step === 1 && (
          <>
            <div className="sm:col-span-2">
              <EvolutionFlavorFields
                idSuffix={projectId}
                flavor={evolutionFlavor}
                onFlavorChange={setEvolutionFlavor}
              />
            </div>
            <div className="sm:col-span-2">
              <FormLabelWithHelp
                htmlFor={`edit-name-${projectId}`}
                description={t(
                  'Nome do projeto exibido no painel.',
                  'Project name shown in the dashboard.',
                )}
                value={name}
              >
                {t('Nome', 'Name')}
              </FormLabelWithHelp>
              <input
                id={`edit-name-${projectId}`}
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="sm:col-span-2">
              <FormLabelWithHelp
                htmlFor={`edit-url-${projectId}`}
                description={t(
                  'URL raiz do servidor Evolution usada pelo worker para health checks e comandos.',
                  'Evolution root URL used by the worker for health checks and commands.',
                )}
                value={evolutionUrl}
              >
                {t('URL base da Evolution API', 'Evolution API base URL')}
              </FormLabelWithHelp>
              <input
                id={`edit-url-${projectId}`}
                type="url"
                className={inputClass}
                value={evolutionUrl}
                onChange={(e) => setEvolutionUrl(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <FormLabelWithHelp
                htmlFor={`edit-key-${projectId}`}
                description={t(
                  'Atualize a chave global da Evolution sem apagar a antiga no banco até você salvar. Deixe em branco para manter.',
                  'Rotate the global Evolution key. Leave blank to keep the current key stored for this project.',
                )}
                value={maskSecretInput(evolutionApiKey)}
              >
                {t('Nova API key da Evolution (opcional)', 'New Evolution API key (optional)')}
              </FormLabelWithHelp>
              <input
                id={`edit-key-${projectId}`}
                type="password"
                className={inputClass}
                value={evolutionApiKey}
                onChange={(e) => setEvolutionApiKey(e.target.value)}
                placeholder={t('Deixe em branco para manter a atual', 'Leave blank to keep current key')}
                autoComplete="new-password"
              />
            </div>
          </>
        )}

        {step === 3 && (
          <div className="sm:col-span-2">
            <ProjectAlertPhoneSection
              ddiId={`edit-alert-ddi-${projectId}`}
              nationalId={`edit-alert-national-${projectId}`}
              ddiValue={alertDdi}
              nationalValue={alertNational}
              onDdiChange={setAlertDdi}
              onNationalChange={setAlertNational}
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={handlePrevStep}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-bg)]/60"
          >
            {t('Voltar', 'Back')}
          </button>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-text)] disabled:opacity-60 transition-opacity hover:opacity-90"
        >
          {step < 3 ? (
            t('Próximo', 'Next')
          ) : (
            loading ? t('Salvando…', 'Saving…') : t('Salvar conexão', 'Save connection')
          )}
        </button>
        
        {step === 3 && ok ? <p className="text-sm text-[var(--color-success)]">{ok}</p> : null}
        {msg ? <p className="text-sm text-[var(--color-error)]">{msg}</p> : null}
      </div>
    </form>
  );
}
