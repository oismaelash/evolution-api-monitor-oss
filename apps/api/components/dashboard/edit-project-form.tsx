'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { composedE164FromDdiFields, updateProjectSchema } from '@monitor/shared';
import { useT } from '@/components/i18n/i18n-provider';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';
import { WhatsappPhoneFields } from '@/components/ui/whatsapp-phone-fields';
import { formatZodIssues } from '@/lib/zod-validation-i18n';
import { FormLabelWithHelp } from '@/components/ui/field-help';

const inputClass =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/70';

export function EditProjectForm({
  projectId,
  initialName,
  initialEvolutionUrl,
  initialAlertDdi,
  initialAlertNational,
}: {
  projectId: string;
  initialName: string;
  initialEvolutionUrl: string;
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

  useEffect(() => {
    setAlertDdi(initialAlertDdi);
    setAlertNational(initialAlertNational);
  }, [initialAlertDdi, initialAlertNational]);

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
      router.refresh();
    } catch {
      setMsg(t('Erro de rede', 'Network error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div>
        <FormLabelWithHelp
          htmlFor={`edit-name-${projectId}`}
          description={t(
            'Nome do projeto exibido no painel.',
            'Project name shown in the dashboard.',
          )}
          example={t('Suporte BR', 'BR Support')}
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
      <div>
        <FormLabelWithHelp
          htmlFor={`edit-url-${projectId}`}
          description={t(
            'URL raiz do servidor Evolution usada pelo worker para health checks e comandos.',
            'Evolution root URL used by the worker for health checks and commands.',
          )}
          example={t('https://evolution.suaempresa.com', 'https://evolution.yourcompany.com')}
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
      <div>
        <FormLabelWithHelp
          htmlFor={`edit-key-${projectId}`}
          description={t(
            'Atualize a chave global da Evolution sem apagar a antiga no banco até você salvar. Deixe em branco para manter.',
            'Rotate the global Evolution key. Leave blank to keep the current key stored for this project.',
          )}
          example={t('Nova chave copiada do Evolution Manager', 'New key copied from Evolution Manager')}
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
      <div className="space-y-1">
        <FormLabelWithHelp
          description={t(
            'Destino WhatsApp (E.164) para alertas do canal Monitor Status.',
            'E.164 WhatsApp destination for Monitor Status alerts.',
          )}
          example={t('+5511999999999', '+5511999999999')}
        >
          {t('Telefone de alerta', 'Alert phone')}
        </FormLabelWithHelp>
        <WhatsappPhoneFields
          ddiId={`edit-alert-ddi-${projectId}`}
          nationalId={`edit-alert-national-${projectId}`}
          ddiValue={alertDdi}
          nationalValue={alertNational}
          onDdiChange={setAlertDdi}
          onNationalChange={setAlertNational}
          perFieldHelp
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? t('Salvando…', 'Saving…') : t('Salvar conexão', 'Save connection')}
        </button>
        {ok ? <p className="text-sm text-[var(--color-success)]">{ok}</p> : null}
        {msg ? <p className="text-sm text-[var(--color-error)]">{msg}</p> : null}
      </div>
    </form>
  );
}
