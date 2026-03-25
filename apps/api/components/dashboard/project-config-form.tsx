'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { projectConfigSchema } from '@monitor/shared';
import { useT } from '@/components/i18n/i18n-provider';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';
import { formatZodIssues } from '@/lib/zod-validation-i18n';
import { SecondsInputHint } from '@/components/ui/seconds-input-hint';
import { FormLabelWithHelp } from '@/components/ui/field-help';

const inputClass =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/70';

export type ProjectConfigFormInitial = {
  pingInterval: number;
  maxRetries: number;
  retryDelay: number;
  retryStrategy: 'FIXED' | 'EXPONENTIAL_JITTER';
};

export function ProjectConfigForm({
  projectId,
  initial,
}: {
  projectId: string;
  initial: ProjectConfigFormInitial;
}) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [pingInterval, setPingInterval] = useState(String(initial.pingInterval));
  const [maxRetries, setMaxRetries] = useState(String(initial.maxRetries));
  const [retryDelay, setRetryDelay] = useState(String(initial.retryDelay));
  const [retryStrategy, setRetryStrategy] = useState<'FIXED' | 'EXPONENTIAL_JITTER'>(
    initial.retryStrategy
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setOk(null);

    const pi = Number.parseInt(pingInterval, 10);
    const mr = Number.parseInt(maxRetries, 10);
    const rd = Number.parseInt(retryDelay, 10);

    const body: Record<string, unknown> = {
      pingInterval: pi,
      maxRetries: mr,
      retryDelay: rd,
      retryStrategy,
    };

    const parsed = projectConfigSchema.safeParse(body);
    if (!parsed.success) {
      setMsg(formatZodIssues(parsed.error.issues, t, { withPath: true }));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/config`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(apiErrorMessage(data, t));
        return;
      }
      setOk(t('Configurações de monitoramento salvas.', 'Monitoring settings saved.'));
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
        <div>
          <FormLabelWithHelp
            htmlFor={`cfg-ping-${projectId}`}
            description={t(
              'Com que frequência o worker consulta a Evolution (health check). Valores menores detectam falhas mais rápido, mas aumentam carga no servidor e na API.',
              'How often the worker polls Evolution for health. Lower values detect outages faster but increase load on your server and the API.',
            )}
            value={pingInterval}
          >
            {t('Intervalo de ping (segundos)', 'Ping interval (seconds)')}
          </FormLabelWithHelp>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <input
              id={`cfg-ping-${projectId}`}
              type="number"
              min={30}
              max={86400}
              className={`${inputClass} min-w-0 flex-1`}
              value={pingInterval}
              onChange={(e) => setPingInterval(e.target.value)}
              required
            />
            <SecondsInputHint value={pingInterval} />
          </div>
        </div>
        <div>
          <FormLabelWithHelp
            htmlFor={`cfg-retry-${projectId}`}
            description={t(
              'Quantas tentativas extras após uma falha antes de considerar o check como falha definitiva e seguir o fluxo de alerta.',
              'How many extra attempts after a failed check before treating the round as failed and moving on to alerts.',
            )}
            value={maxRetries}
          >
            {t('Máx. tentativas', 'Max retries')}
          </FormLabelWithHelp>
          <input
            id={`cfg-retry-${projectId}`}
            type="number"
            min={0}
            max={10}
            className={inputClass}
            value={maxRetries}
            onChange={(e) => setMaxRetries(e.target.value)}
            required
          />
        </div>
        <div>
          <FormLabelWithHelp
            htmlFor={`cfg-delay-${projectId}`}
            description={t(
              'Tempo de espera entre uma tentativa falha e a próxima (usado com a estratégia de retry configurada).',
              'Wait time between a failed attempt and the next retry (used with your retry strategy).',
            )}
            value={retryDelay}
          >
            {t('Atraso entre tentativas (segundos)', 'Retry delay (seconds)')}
          </FormLabelWithHelp>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <input
              id={`cfg-delay-${projectId}`}
              type="number"
              min={5}
              max={3600}
              className={`${inputClass} min-w-0 flex-1`}
              value={retryDelay}
              onChange={(e) => setRetryDelay(e.target.value)}
              required
            />
            <SecondsInputHint value={retryDelay} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <FormLabelWithHelp
            htmlFor={`cfg-strat-${projectId}`}
            description={t(
              'Fixo usa sempre o mesmo atraso. Exponential jitter aumenta o intervalo com variação aleatória para evitar que muitas instâncias tentem ao mesmo tempo.',
              'Fixed always uses the same delay. Exponential jitter increases the backoff with random jitter so many instances do not retry in sync.',
            )}
            value={retryStrategy}
          >
            {t('Estratégia de retry', 'Retry strategy')}
          </FormLabelWithHelp>
          <select
            id={`cfg-strat-${projectId}`}
            className={inputClass}
            value={retryStrategy}
            onChange={(e) =>
              setRetryStrategy(e.target.value as 'FIXED' | 'EXPONENTIAL_JITTER')
            }
          >
            <option value="FIXED">{t('Fixo', 'Fixed')}</option>
            <option value="EXPONENTIAL_JITTER">{t('Exponential jitter', 'Exponential jitter')}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? t('Salvando…', 'Saving…') : t('Salvar monitoramento', 'Save monitoring settings')}
        </button>
        {ok ? <p className="text-sm text-[var(--color-success)]">{ok}</p> : null}
        {msg ? <p className="text-sm text-[var(--color-error)]">{msg}</p> : null}
      </div>
    </form>
  );
}
