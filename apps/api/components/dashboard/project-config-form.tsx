'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { projectConfigSchema } from '@monitor/shared';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';

const labelClass = 'mb-1 block text-sm font-medium text-[var(--color-text-muted)]';
const inputClass =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/70';

const CHANNELS = ['MONITOR_STATUS', 'EMAIL', 'WEBHOOK'] as const;

export type ProjectConfigFormInitial = {
  pingInterval: number;
  maxRetries: number;
  retryDelay: number;
  retryStrategy: 'FIXED' | 'EXPONENTIAL_JITTER';
  alertCooldown: number;
  alertChannels: string[];
  alertTemplate: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  webhookUrl: string | null;
};

export function ProjectConfigForm({
  projectId,
  initial,
}: {
  projectId: string;
  initial: ProjectConfigFormInitial;
}) {
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
  const [alertCooldown, setAlertCooldown] = useState(String(initial.alertCooldown));
  const [alertTemplate, setAlertTemplate] = useState(initial.alertTemplate ?? '');
  const [channels, setChannels] = useState<Set<string>>(new Set(initial.alertChannels));

  const [smtpHost, setSmtpHost] = useState(initial.smtpHost ?? '');
  const [smtpPort, setSmtpPort] = useState(initial.smtpPort != null ? String(initial.smtpPort) : '');
  const [smtpUser, setSmtpUser] = useState(initial.smtpUser ?? '');
  const [smtpPass, setSmtpPass] = useState('');
  const [webhookUrl, setWebhookUrl] = useState(initial.webhookUrl ?? '');
  const [webhookSecret, setWebhookSecret] = useState('');

  function toggleChannel(c: (typeof CHANNELS)[number]) {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setOk(null);

    if (channels.size === 0) {
      setMsg('Select at least one alert channel.');
      return;
    }

    const pi = Number.parseInt(pingInterval, 10);
    const mr = Number.parseInt(maxRetries, 10);
    const rd = Number.parseInt(retryDelay, 10);
    const ac = Number.parseInt(alertCooldown, 10);
    const sp =
      smtpPort.trim() === '' ? null : Number.parseInt(smtpPort.trim(), 10);

    const body: Record<string, unknown> = {
      pingInterval: pi,
      maxRetries: mr,
      retryDelay: rd,
      retryStrategy,
      alertCooldown: ac,
      alertChannels: Array.from(channels).filter((x): x is 'MONITOR_STATUS' | 'EMAIL' | 'WEBHOOK' =>
        CHANNELS.includes(x as (typeof CHANNELS)[number])
      ),
      alertTemplate: alertTemplate.trim() === '' ? null : alertTemplate.trim(),
      smtpHost: smtpHost.trim() === '' ? null : smtpHost.trim(),
      smtpPort: sp,
      smtpUser: smtpUser.trim() === '' ? null : smtpUser.trim(),
      webhookUrl: webhookUrl.trim() === '' ? null : webhookUrl.trim(),
    };

    if (smtpPass.trim().length > 0) {
      body.smtpPass = smtpPass.trim();
    }
    if (webhookSecret.trim().length > 0) {
      body.webhookSecret = webhookSecret.trim();
    }

    const parsed = projectConfigSchema.safeParse(body);
    if (!parsed.success) {
      setMsg(parsed.error.errors.map((x) => `${x.path.join('.')}: ${x.message}`).join(' · '));
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
        setMsg(apiErrorMessage(data));
        return;
      }
      setSmtpPass('');
      setWebhookSecret('');
      setOk('Settings saved.');
      router.refresh();
    } catch {
      setMsg('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`cfg-ping-${projectId}`}>
            Ping interval (seconds)
          </label>
          <input
            id={`cfg-ping-${projectId}`}
            type="number"
            min={30}
            max={86400}
            className={inputClass}
            value={pingInterval}
            onChange={(e) => setPingInterval(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`cfg-cool-${projectId}`}>
            Alert cooldown (seconds)
          </label>
          <input
            id={`cfg-cool-${projectId}`}
            type="number"
            min={60}
            max={86400}
            className={inputClass}
            value={alertCooldown}
            onChange={(e) => setAlertCooldown(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`cfg-retry-${projectId}`}>
            Max retries
          </label>
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
          <label className={labelClass} htmlFor={`cfg-delay-${projectId}`}>
            Retry delay (seconds)
          </label>
          <input
            id={`cfg-delay-${projectId}`}
            type="number"
            min={5}
            max={3600}
            className={inputClass}
            value={retryDelay}
            onChange={(e) => setRetryDelay(e.target.value)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor={`cfg-strat-${projectId}`}>
            Retry strategy
          </label>
          <select
            id={`cfg-strat-${projectId}`}
            className={inputClass}
            value={retryStrategy}
            onChange={(e) =>
              setRetryStrategy(e.target.value as 'FIXED' | 'EXPONENTIAL_JITTER')
            }
          >
            <option value="FIXED">Fixed</option>
            <option value="EXPONENTIAL_JITTER">Exponential jitter</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <span className={labelClass}>Alert channels</span>
          <div className="flex flex-wrap gap-4">
            {CHANNELS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--color-border)]"
                  checked={channels.has(c)}
                  onChange={() => toggleChannel(c)}
                />
                {c}
              </label>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor={`cfg-tpl-${projectId}`}>
            Alert template (optional, Handlebars)
          </label>
          <textarea
            id={`cfg-tpl-${projectId}`}
            rows={3}
            className={inputClass}
            value={alertTemplate}
            onChange={(e) => setAlertTemplate(e.target.value)}
            placeholder="Custom message template"
          />
        </div>
      </div>

      <details className="rounded-md border border-[var(--color-border)] p-4">
        <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-primary)]">
          Email &amp; webhook (optional)
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`cfg-smtp-host-${projectId}`}>
              SMTP host
            </label>
            <input
              id={`cfg-smtp-host-${projectId}`}
              className={inputClass}
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`cfg-smtp-port-${projectId}`}>
              SMTP port
            </label>
            <input
              id={`cfg-smtp-port-${projectId}`}
              type="number"
              className={inputClass}
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`cfg-smtp-user-${projectId}`}>
              SMTP user
            </label>
            <input
              id={`cfg-smtp-user-${projectId}`}
              className={inputClass}
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`cfg-smtp-pass-${projectId}`}>
              SMTP password (leave blank to keep)
            </label>
            <input
              id={`cfg-smtp-pass-${projectId}`}
              type="password"
              className={inputClass}
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`cfg-wh-url-${projectId}`}>
              Webhook URL
            </label>
            <input
              id={`cfg-wh-url-${projectId}`}
              type="url"
              className={inputClass}
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://example.com/hooks/alerts"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`cfg-wh-sec-${projectId}`}>
              Webhook secret (leave blank to keep)
            </label>
            <input
              id={`cfg-wh-sec-${projectId}`}
              type="password"
              className={inputClass}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save monitoring settings'}
        </button>
        {ok ? <p className="text-sm text-[var(--color-success)]">{ok}</p> : null}
        {msg ? <p className="text-sm text-[var(--color-error)]">{msg}</p> : null}
      </div>
    </form>
  );
}
