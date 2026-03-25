'use client';

import { ArrowDown2, Add } from 'iconsax-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  composedE164FromDdiFields,
  createProjectSchema,
  EvolutionFlavor,
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

export function CreateProjectForm() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [evolutionUrl, setEvolutionUrl] = useState('');
  const [evolutionApiKey, setEvolutionApiKey] = useState('');
  const [alertDdi, setAlertDdi] = useState('');
  const [alertNational, setAlertNational] = useState('');
  const [evolutionFlavor, setEvolutionFlavor] = useState<EvolutionFlavorType>(EvolutionFlavor.EVOLUTION_V2);

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
      if (!evolutionUrl.trim() || !evolutionApiKey.trim()) {
        setMsg(t('URL e API Key são obrigatórios', 'URL and API Key are required'));
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
    const raw = {
      name: name.trim(),
      evolutionFlavor,
      evolutionUrl: evolutionUrl.trim(),
      evolutionApiKey: evolutionApiKey.trim(),
      alertPhone: alertResult === 'empty' ? undefined : alertResult,
    };
    const parsed = createProjectSchema.safeParse(raw);
    if (!parsed.success) {
      setMsg(formatZodIssues(parsed.error.issues, t));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: unknown };
      if (!res.ok) {
        setMsg(apiErrorMessage(data, t));
        return;
      }
      if (data.id) {
        router.push(`/projects/${data.id}`);
        router.refresh();
        return;
      }
      setMsg(t('Criado, mas o id do projeto não foi retornado', 'Created but no project id returned'));
    } catch {
      setMsg(t('Erro de rede', 'Network error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id="create-project"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 3) void onSubmit(e);
        else handleNextStep();
      }}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <button
        type="button"
        id="create-project-heading"
        aria-expanded={open}
        aria-controls="create-project-panel"
        onClick={() => setOpen((v) => !v)}
        className={`relative z-0 flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-[var(--color-bg)]/40 sm:px-6 ${open ? 'rounded-t-lg' : 'rounded-lg'}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <Add size="20" variant="Outline" />
          </div>
          <span className="text-lg font-medium text-[var(--color-text-primary)]">
            {t('Novo projeto', 'New project')}
          </span>
        </div>
        <ArrowDown2
          size={20}
          variant="Linear"
          color="var(--color-text-muted)"
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <div
        id="create-project-panel"
        role="region"
        aria-labelledby="create-project-heading"
        hidden={!open}
        className={
          open
            ? 'relative z-20 rounded-b-lg border-t border-[var(--color-border)] px-6 pb-6 pt-4'
            : undefined
        }
      >
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {step === 1 && t('Passo 1: Dados Iniciais', 'Step 1: Base Data')}
            {step === 2 && t('Passo 2: Credenciais', 'Step 2: Credentials')}
            {step === 3 && t('Passo 3: Alertas (Opcional)', 'Step 3: Alerts (Optional)')}
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
                  idSuffix="create"
                  flavor={evolutionFlavor}
                  onFlavorChange={setEvolutionFlavor}
                />
              </div>
              <div className="sm:col-span-2">
                <FormLabelWithHelp
                  htmlFor="proj-name"
                  description={t(
                    'Nome amigável do projeto no painel (não altera a Evolution).',
                    'Friendly project name in the dashboard (does not change Evolution).',
                  )}
                  value={name}
                >
                  {t('Nome', 'Name')}
                </FormLabelWithHelp>
                <input
                  id="proj-name"
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('WhatsApp produção', 'Production WhatsApp')}
                  autoComplete="off"
                  required
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="sm:col-span-2 text-sm text-[var(--color-text-muted)]">
                {t(
                  'Um servidor Evolution por projeto: URL base e API key global (igual ao Evolution Manager).',
                  'One Evolution server per project: base URL and global API key (same as Evolution Manager).',
                )}
              </p>
              <div className="sm:col-span-2">
                <FormLabelWithHelp
                  htmlFor="proj-url"
                  description={t(
                    'URL raiz do servidor Evolution (sem path da instância). O monitor chama a API nesse host.',
                    'Root URL of your Evolution server (no instance path). The monitor calls the API on this host.',
                  )}
                  value={evolutionUrl}
                >
                  {t('URL base da Evolution API', 'Evolution API base URL')}
                </FormLabelWithHelp>
                <input
                  id="proj-url"
                  type="url"
                  className={inputClass}
                  value={evolutionUrl}
                  onChange={(e) => setEvolutionUrl(e.target.value)}
                  placeholder="https://evolution.example.com"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <FormLabelWithHelp
                  htmlFor="proj-key"
                  description={t(
                    'Chave global da Evolution (mesma do Evolution Manager / AUTHENTICATION_API_KEY). Usada só no servidor.',
                    'Global Evolution API key (same as Evolution Manager / AUTHENTICATION_API_KEY). Used only on the server.',
                  )}
                  value={maskSecretInput(evolutionApiKey)}
                >
                  {t('API key da Evolution', 'Evolution API key')}
                </FormLabelWithHelp>
                <input
                  id="proj-key"
                  type="password"
                  className={inputClass}
                  value={evolutionApiKey}
                  onChange={(e) => setEvolutionApiKey(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="off"
                  required
                />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="sm:col-span-2">
              <ProjectAlertPhoneSection
                ddiId="proj-alert-ddi"
                nationalId="proj-alert-national"
                ddiValue={alertDdi}
                nationalValue={alertNational}
                onDdiChange={setAlertDdi}
                onNationalChange={setAlertNational}
                optional
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
            className="flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {step < 3 ? (
              t('Próximo', 'Next')
            ) : (
              <>
                <Add size="18" variant="Outline" />
                {loading ? t('Criando…', 'Creating…') : t('Criar projeto', 'Create project')}
              </>
            )}
          </button>
          
          {msg ? <p className="text-sm text-[var(--color-error)]">{msg}</p> : null}
        </div>
      </div>
    </form>
  );
}
