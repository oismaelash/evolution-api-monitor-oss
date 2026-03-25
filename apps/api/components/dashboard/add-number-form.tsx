'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { addNumberSchema } from '@monitor/shared';
import { useT } from '@/components/i18n/i18n-provider';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';

const labelClass = 'mb-1 block text-sm font-medium text-[var(--color-text-muted)]';
const inputClass =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/70';

export function AddNumberForm({ projectId }: { projectId: string }) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [label, setLabel] = useState('');
  const [monitored, setMonitored] = useState(true);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setOk(null);
    const raw = {
      instanceName: instanceName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      label: label.trim() || undefined,
      monitored,
    };
    const parsed = addNumberSchema.safeParse(raw);
    if (!parsed.success) {
      setMsg(parsed.error.errors.map((x) => x.message).join(' · '));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/numbers`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(apiErrorMessage(data, t));
        return;
      }
      setInstanceName('');
      setPhoneNumber('');
      setLabel('');
      setMonitored(true);
      setOk(t('Número adicionado.', 'Number added.'));
      router.refresh();
    } catch {
      setMsg(t('Erro de rede', 'Network error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor={`add-inst-${projectId}`}>
            {t('Nome da instância', 'Instance name')}
          </label>
          <input
            id={`add-inst-${projectId}`}
            className={inputClass}
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            placeholder={t('Deve coincidir com o nome na Evolution', 'Must match Evolution instance name')}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`add-phone-${projectId}`}>
            {t('Telefone (opcional)', 'Phone (optional)')}
          </label>
          <input
            id={`add-phone-${projectId}`}
            className={inputClass}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="5511999999999"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`add-label-${projectId}`}>
            {t('Rótulo (opcional)', 'Label (optional)')}
          </label>
          <input
            id={`add-label-${projectId}`}
            className={inputClass}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('Linha de suporte', 'Support line')}
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id={`add-mon-${projectId}`}
            type="checkbox"
            className="h-4 w-4 rounded border-[var(--color-border)]"
            checked={monitored}
            onChange={(e) => setMonitored(e.target.checked)}
          />
          <label htmlFor={`add-mon-${projectId}`} className="text-sm text-[var(--color-text-primary)]">
            {t('Monitorado (health checks e alertas)', 'Monitored (health checks & alerts)')}
          </label>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] disabled:opacity-60"
        >
          {loading ? t('Adicionando…', 'Adding…') : t('Adicionar número', 'Add number')}
        </button>
        {ok ? <p className="text-sm text-[var(--color-success)]">{ok}</p> : null}
        {msg ? <p className="text-sm text-[var(--color-error)]">{msg}</p> : null}
      </div>
    </form>
  );
}
