'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateProjectSchema } from '@monitor/shared';
import { useT } from '@/components/i18n/i18n-provider';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';

const labelClass = 'mb-1 block text-sm font-medium text-[var(--color-text-muted)]';
const inputClass =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/70';

export function EditProjectForm({
  projectId,
  initialName,
  initialEvolutionUrl,
  initialAlertPhone,
}: {
  projectId: string;
  initialName: string;
  initialEvolutionUrl: string;
  initialAlertPhone: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [name, setName] = useState(initialName);
  const [evolutionUrl, setEvolutionUrl] = useState(initialEvolutionUrl);
  const [evolutionApiKey, setEvolutionApiKey] = useState('');
  const [alertPhone, setAlertPhone] = useState(initialAlertPhone ?? '');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setOk(null);
    const body: Record<string, unknown> = {
      name: name.trim(),
      evolutionUrl: evolutionUrl.trim(),
      alertPhone: alertPhone.trim() === '' ? null : alertPhone.trim(),
    };
    const key = evolutionApiKey.trim();
    if (key.length > 0) {
      body.evolutionApiKey = key;
    }
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      setMsg(parsed.error.errors.map((x) => x.message).join(' · '));
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
        <label className={labelClass} htmlFor={`edit-name-${projectId}`}>
          {t('Nome', 'Name')}
        </label>
        <input
          id={`edit-name-${projectId}`}
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className={labelClass} htmlFor={`edit-url-${projectId}`}>
          {t('URL base da Evolution API', 'Evolution API base URL')}
        </label>
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
        <label className={labelClass} htmlFor={`edit-key-${projectId}`}>
          {t('Nova API key da Evolution (opcional)', 'New Evolution API key (optional)')}
        </label>
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
      <div>
        <label className={labelClass} htmlFor={`edit-alert-${projectId}`}>
          {t('Telefone de alerta (E.164)', 'Alert phone (E.164)')}
        </label>
        <input
          id={`edit-alert-${projectId}`}
          className={inputClass}
          value={alertPhone}
          onChange={(e) => setAlertPhone(e.target.value)}
          placeholder="+5511999999999"
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
