'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { projectConfigSchema } from '@monitor/shared';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';

const labelClass = 'mb-1 block text-sm font-medium text-[var(--color-text-muted)]';
const inputClass =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/70';

const CHANNELS = ['MONITOR_STATUS', 'EMAIL', 'WEBHOOK'] as const;

const CHANNEL_LABELS: Record<(typeof CHANNELS)[number], string> = {
  MONITOR_STATUS: 'Monitor Status (WhatsApp)',
  EMAIL: 'Email (SMTP)',
  WEBHOOK: 'Webhook',
};

export type ProjectAlertsFormInitial = {
  alertCooldown: number;
  alertChannels: string[];
  alertTemplate: string | null;
  alertEmail: string | null;
  smtpFrom: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  webhookUrl: string | null;
};

export function ProjectAlertsForm({
  projectId,
  initial,
}: {
  projectId: string;
  initial: ProjectAlertsFormInitial;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [alertCooldown, setAlertCooldown] = useState(String(initial.alertCooldown));
  const [alertTemplate, setAlertTemplate] = useState(initial.alertTemplate ?? '');
  const [channels, setChannels] = useState<Set<string>>(new Set(initial.alertChannels));

  const [alertEmail, setAlertEmail] = useState(initial.alertEmail ?? '');
  const [smtpFrom, setSmtpFrom] = useState(initial.smtpFrom ?? '');
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

    const ac = Number.parseInt(alertCooldown, 10);
    const sp =
      smtpPort.trim() === '' ? null : Number.parseInt(smtpPort.trim(), 10);

    const body: Record<string, unknown> = {
      alertCooldown: ac,
      alertChannels: Array.from(channels).filter((x): x is 'MONITOR_STATUS' | 'EMAIL' | 'WEBHOOK' =>
        CHANNELS.includes(x as (typeof CHANNELS)[number])
      ),
      alertTemplate: alertTemplate.trim() === '' ? null : alertTemplate.trim(),
      alertEmail: alertEmail.trim() === '' ? null : alertEmail.trim(),
      smtpFrom: smtpFrom.trim() === '' ? null : smtpFrom.trim(),
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
      setOk('Alert settings saved.');
      router.refresh();
    } catch {
      setMsg('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-base font-medium text-[var(--color-text-primary)]">Channels &amp; rate limit</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Choose where outage notifications go. For{' '}
          <span className="text-[var(--color-text-primary)]">Monitor Status</span>, set the WhatsApp
          destination (E.164) under{' '}
          <span className="text-[var(--color-text-primary)]">Project → Connection → Alert phone</span>.
        </p>
        <div>
          <label className={labelClass} htmlFor={`al-cool-${projectId}`}>
            Alert cooldown (seconds)
          </label>
          <input
            id={`al-cool-${projectId}`}
            type="number"
            min={60}
            max={86400}
            className={inputClass}
            value={alertCooldown}
            onChange={(e) => setAlertCooldown(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Minimum time between repeated alerts for the same incident.
          </p>
        </div>
        <div>
          <span className={labelClass}>Alert channels</span>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            {CHANNELS.map((c) => (
              <label
                key={c}
                className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--color-border)]"
                  checked={channels.has(c)}
                  onChange={() => toggleChannel(c)}
                />
                {CHANNEL_LABELS[c]}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor={`al-tpl-${projectId}`}>
            Alert template (optional, Handlebars)
          </label>
          <textarea
            id={`al-tpl-${projectId}`}
            rows={4}
            className={inputClass}
            value={alertTemplate}
            onChange={(e) => setAlertTemplate(e.target.value)}
            placeholder="Custom message body for alerts"
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-[var(--color-border)] pt-8">
        <h3 className="text-base font-medium text-[var(--color-text-primary)]">Email (SMTP)</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Required when the Email channel is enabled. Password is stored encrypted; leave blank to keep
          the current value.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`al-email-${projectId}`}>
              Destination email
            </label>
            <input
              id={`al-email-${projectId}`}
              type="email"
              className={inputClass}
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`al-smtp-from-${projectId}`}>
              From (optional)
            </label>
            <input
              id={`al-smtp-from-${projectId}`}
              className={inputClass}
              value={smtpFrom}
              onChange={(e) => setSmtpFrom(e.target.value)}
              placeholder={'Monitor <alerts@company.com>'}
              autoComplete="off"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`al-smtp-host-${projectId}`}>
              SMTP host
            </label>
            <input
              id={`al-smtp-host-${projectId}`}
              className={inputClass}
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`al-smtp-port-${projectId}`}>
              SMTP port
            </label>
            <input
              id={`al-smtp-port-${projectId}`}
              type="number"
              className={inputClass}
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`al-smtp-user-${projectId}`}>
              SMTP user
            </label>
            <input
              id={`al-smtp-user-${projectId}`}
              className={inputClass}
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`al-smtp-pass-${projectId}`}>
              SMTP password (leave blank to keep)
            </label>
            <input
              id={`al-smtp-pass-${projectId}`}
              type="password"
              className={inputClass}
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-[var(--color-border)] pt-8">
        <h3 className="text-base font-medium text-[var(--color-text-primary)]">Webhook</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          POST JSON payloads to your endpoint when the Webhook channel is enabled. Optional secret is sent
          for verification and stored encrypted.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`al-wh-url-${projectId}`}>
              Webhook URL
            </label>
            <input
              id={`al-wh-url-${projectId}`}
              type="url"
              className={inputClass}
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://example.com/hooks/alerts"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`al-wh-sec-${projectId}`}>
              Webhook secret (leave blank to keep)
            </label>
            <input
              id={`al-wh-sec-${projectId}`}
              type="password"
              className={inputClass}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-6">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save alert settings'}
        </button>
        {ok ? <p className="text-sm text-[var(--color-success)]">{ok}</p> : null}
        {msg ? <p className="text-sm text-[var(--color-error)]">{msg}</p> : null}
      </div>
    </form>
  );
}
