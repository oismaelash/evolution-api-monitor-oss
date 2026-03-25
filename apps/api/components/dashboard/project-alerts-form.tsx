'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  projectConfigSchema,
  getWebhookAlertPayloadExampleStrings,
  WEBHOOK_ALERT_REQUEST_HEADERS,
} from '@monitor/shared';
import { useT } from '@/components/i18n/i18n-provider';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';
import { formatZodIssues } from '@/lib/zod-validation-i18n';
import { SecondsInputHint } from '@/components/ui/seconds-input-hint';
import { FormLabelWithHelp, maskSecretInput } from '@/components/ui/field-help';
import { Save2, Eye, EyeSlash, MessageText1, Sms, Link as LinkIcon } from 'iconsax-react';

const inputClass =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/70';

const CHANNELS = ['MONITOR_STATUS', 'EMAIL', 'WEBHOOK'] as const;

const webhookAlertPayloadExamples = getWebhookAlertPayloadExampleStrings();

function channelLabel(
  c: (typeof CHANNELS)[number],
  t: (pt: string, en: string) => string,
): string {
  switch (c) {
    case 'MONITOR_STATUS':
      return t('Monitor Status (WhatsApp)', 'Monitor Status (WhatsApp)');
    case 'EMAIL':
      return t('E-mail (SMTP)', 'Email (SMTP)');
    case 'WEBHOOK':
      return t('Webhook', 'Webhook');
  }
}

export type ProjectAlertsFormInitial = {
  alertCooldown: number;
  alertChannels: string[];
  alertTemplate: string | null;
  whatsappSender: string | null;
  alertEmail: string | null;
  smtpFrom: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  webhookUrl: string | null;
  numbers?: { id: string; instanceName: string; phoneNumber: string | null; state: string }[];
};

export function ProjectAlertsForm({
  projectId,
  initial,
}: {
  projectId: string;
  initial: ProjectAlertsFormInitial;
}) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MONITOR_STATUS' | 'EMAIL' | 'WEBHOOK'>('MONITOR_STATUS');

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
  const [showWebhookPayloadFormat, setShowWebhookPayloadFormat] = useState(false);

  // For the WhatsApp sender selection (mocking the UI structure as requested)
  const [whatsappSender, setWhatsappSender] = useState<string>(initial.whatsappSender ?? 'pilot_status');

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
      setMsg(t('Selecione pelo menos um canal de alerta.', 'Select at least one alert channel.'));
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
      whatsappSender: whatsappSender,
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
      setSmtpPass('');
      setWebhookSecret('');
      setOk(t('Configurações de alerta salvas.', 'Alert settings saved.'));
      router.refresh();
    } catch {
      setMsg(t('Erro de rede', 'Network error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-base font-medium text-[var(--color-text-primary)]">
          {t('Canais e limite de taxa', 'Channels & rate limit')}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          {t(
            'Escolha para onde vão as notificações de indisponibilidade. Para',
            'Choose where outage notifications go. For',
          )}{' '}
          <span className="text-[var(--color-text-primary)]">Monitor Status</span>,{' '}
          {t(
            'defina o destino WhatsApp (E.164) em',
            'set the WhatsApp destination (E.164) under',
          )}{' '}
          <span className="text-[var(--color-text-primary)]">
            {t('Projeto → Conexão → Telefone de alerta', 'Project → Connection → Alert phone')}
          </span>
          .
        </p>
        <div>
          <FormLabelWithHelp
            htmlFor={`al-cool-${projectId}`}
            description={t(
              'Tempo mínimo entre alertas repetidos para o mesmo incidente (evita spam enquanto o problema continua).',
              'Minimum time between repeated alerts for the same incident (reduces spam while the issue persists).',
            )}
            value={alertCooldown}
          >
            {t('Intervalo entre alertas (segundos)', 'Alert cooldown (seconds)')}
          </FormLabelWithHelp>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <input
              id={`al-cool-${projectId}`}
              type="number"
              min={60}
              max={86400}
              className={`${inputClass} min-w-0 flex-1`}
              value={alertCooldown}
              onChange={(e) => setAlertCooldown(e.target.value)}
              required
            />
            <SecondsInputHint value={alertCooldown} />
          </div>
        </div>
      </section>

      <section className="space-y-6 pt-6">
        <div className="flex border-b border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setActiveTab('MONITOR_STATUS')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'MONITOR_STATUS'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]'
            }`}
          >
            <MessageText1 size="18" />
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('EMAIL')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'EMAIL'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]'
            }`}
          >
            <Sms size="18" />
            {t('E-mail', 'Email')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('WEBHOOK')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'WEBHOOK'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]'
            }`}
          >
            <LinkIcon size="18" />
            Webhook
          </button>
        </div>

        {/* WHATSAPP TAB */}
        <div className={activeTab === 'MONITOR_STATUS' ? 'block space-y-4' : 'hidden'}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-[var(--color-text-primary)]">
              {t('Notificações via WhatsApp', 'WhatsApp Notifications')}
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium text-[var(--color-text-muted)]">
                {channels.has('MONITOR_STATUS') ? t('Ativado', 'Enabled') : t('Desativado', 'Disabled')}
              </span>
              <div className="relative inline-block w-10 h-6">
                <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={channels.has('MONITOR_STATUS')}
                  onChange={() => toggleChannel('MONITOR_STATUS')}
                />
                <div className="block h-6 w-10 rounded-full bg-[var(--color-border)] transition peer-checked:bg-[var(--color-accent)]"></div>
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></div>
              </div>
            </label>
          </div>
          
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-4">
            <FormLabelWithHelp
              description={t(
                'Escolha por qual número as notificações de alerta serão enviadas.',
                'Choose which number will send the alert notifications.',
              )}
              value={whatsappSender}
            >
              {t('Remetente do WhatsApp', 'WhatsApp Sender')}
            </FormLabelWithHelp>
            
            <div className="mt-3 space-y-3">
              <label className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${whatsappSender === 'pilot_status' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] hover:bg-[var(--color-surface)]'}`}>
                <input 
                  type="radio" 
                  name="whatsappSender" 
                  value="pilot_status" 
                  className="mt-1"
                  checked={whatsappSender === 'pilot_status'}
                  onChange={() => setWhatsappSender('pilot_status')}
                />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('Padrão do Sistema (Pilot Status)', 'System Default (Pilot Status)')}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {t('Usa o número oficial do monitor para enviar os alertas.', 'Uses the official monitor number to send alerts.')}
                  </p>
                </div>
              </label>

              {initial.numbers?.filter(n => n.state === 'CONNECTED').map(num => (
                <label key={num.id} className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${whatsappSender === num.id ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] hover:bg-[var(--color-surface)]'}`}>
                  <input 
                    type="radio" 
                    name="whatsappSender" 
                    value={num.id} 
                    className="mt-1"
                    checked={whatsappSender === num.id}
                    onChange={() => setWhatsappSender(num.id)}
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {num.instanceName} {num.phoneNumber ? `(${num.phoneNumber})` : ''}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {t('Usa este número conectado para enviar as mensagens.', 'Uses this connected number to send the messages.')}
                    </p>
                  </div>
                </label>
              ))}

              {(!initial.numbers || initial.numbers.filter(n => n.state === 'CONNECTED').length === 0) && (
                <p className="text-xs text-[var(--color-text-muted)] italic mt-2">
                  {t('* Nenhum outro número conectado e saudável encontrado neste projeto para ser usado como remetente.', '* No other connected and healthy numbers found in this project to be used as sender.')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* EMAIL TAB */}
        <div className={activeTab === 'EMAIL' ? 'block space-y-4' : 'hidden'}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-[var(--color-text-primary)]">
              {t('Configurações de E-mail (SMTP)', 'Email Settings (SMTP)')}
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium text-[var(--color-text-muted)]">
                {channels.has('EMAIL') ? t('Ativado', 'Enabled') : t('Desativado', 'Disabled')}
              </span>
              <div className="relative inline-block w-10 h-6">
                <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={channels.has('EMAIL')}
                  onChange={() => toggleChannel('EMAIL')}
                />
                <div className="block h-6 w-10 rounded-full bg-[var(--color-border)] transition peer-checked:bg-[var(--color-accent)]"></div>
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></div>
              </div>
            </label>
          </div>
        <p className="text-sm text-[var(--color-text-muted)] mb-2">
          {t(
            'Obrigatório quando o canal E-mail está ativo. A senha é armazenada criptografada; deixe em branco para manter o valor atual.',
            'Required when the Email channel is enabled. Password is stored encrypted; leave blank to keep the current value.',
          )}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
          {t('Não sabe como pegar os dados do SMTP do seu Gmail? ', "Don't know how to get your Gmail SMTP settings? ")}
          <a 
            href="https://www.gmass.co/blog/gmail-smtp/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline"
          >
            {t('Clique aqui para ver um tutorial.', 'Click here for a tutorial.')}
          </a>
        </p>
        <div className="flex flex-col gap-4">
          <div className="sm:col-span-2">
            <FormLabelWithHelp
              htmlFor={`al-email-${projectId}`}
              description={t(
                'Endereço que receberá os alertas quando o canal E-mail estiver ativo.',
                'Inbox address that receives alerts when the Email channel is enabled.',
              )}
              value={alertEmail}
            >
              {t('E-mail de destino', 'Destination email')}
            </FormLabelWithHelp>
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
            <FormLabelWithHelp
              htmlFor={`al-smtp-from-${projectId}`}
              description={t(
                'Cabeçalho From exibido pelo cliente de e-mail. Opcional; o servidor pode preencher um padrão.',
                'From header shown in the mail client. Optional; your SMTP server may apply a default.',
              )}
              value={smtpFrom}
            >
              {t('Remetente (opcional)', 'From (optional)')}
            </FormLabelWithHelp>
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
            <FormLabelWithHelp
              htmlFor={`al-smtp-host-${projectId}`}
              description={t(
                'Nome do servidor de e-mail (SMTP) que enviará os alertas.',
                'Hostname of the SMTP server that will send alert emails.',
              )}
              value={smtpHost}
            >
              {t('Host SMTP', 'SMTP host')}
            </FormLabelWithHelp>
            <input
              id={`al-smtp-host-${projectId}`}
              className={inputClass}
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <FormLabelWithHelp
              htmlFor={`al-smtp-port-${projectId}`}
              description={t(
                'Porta do servidor SMTP. Com TLS geralmente 587 (STARTTLS) ou 465 (SSL); confira o provedor.',
                'SMTP server port. With TLS this is often 587 (STARTTLS) or 465 (SSL); check your provider.',
              )}
              value={smtpPort}
            >
              {t('Porta SMTP', 'SMTP port')}
            </FormLabelWithHelp>
            <input
              id={`al-smtp-port-${projectId}`}
              type="number"
              className={inputClass}
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
            />
          </div>
          <div>
            <FormLabelWithHelp
              htmlFor={`al-smtp-user-${projectId}`}
              description={t(
                'Usuário para autenticação no SMTP (muitas vezes o próprio e-mail ou um usuário API).',
                'Username for SMTP authentication (often the mailbox email or an API user).',
              )}
              value={smtpUser}
            >
              {t('Usuário SMTP', 'SMTP user')}
            </FormLabelWithHelp>
            <input
              id={`al-smtp-user-${projectId}`}
              className={inputClass}
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="sm:col-span-2">
            <FormLabelWithHelp
              htmlFor={`al-smtp-pass-${projectId}`}
              description={t(
                'Senha ou token do SMTP; armazenada criptografada. Deixe em branco para não alterar o valor já salvo.',
                'SMTP password or app token; stored encrypted. Leave blank to keep the current saved value.',
              )}
              value={maskSecretInput(smtpPass)}
            >
              {t('Senha SMTP (em branco para manter)', 'SMTP password (leave blank to keep)')}
            </FormLabelWithHelp>
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
        </div>

        {/* WEBHOOK TAB */}
        <div className={activeTab === 'WEBHOOK' ? 'block space-y-4' : 'hidden'}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-[var(--color-text-primary)]">
              {t('Webhook', 'Webhook')}
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium text-[var(--color-text-muted)]">
                {channels.has('WEBHOOK') ? t('Ativado', 'Enabled') : t('Desativado', 'Disabled')}
              </span>
              <div className="relative inline-block w-10 h-6">
                <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={channels.has('WEBHOOK')}
                  onChange={() => toggleChannel('WEBHOOK')}
                />
                <div className="block h-6 w-10 rounded-full bg-[var(--color-border)] transition peer-checked:bg-[var(--color-accent)]"></div>
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></div>
              </div>
            </label>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-2">
          {t(
            'Envia payloads JSON ao endpoint quando o canal Webhook está ativo. Segredo opcional para verificação, armazenado criptografado.',
            'POST JSON payloads to your endpoint when the Webhook channel is enabled. Optional secret is sent for verification and stored encrypted.',
          )}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
          {t('Precisa de um webhook para testar? Use o ', 'Need a webhook to test? Use ')}
          <a 
            href="https://webhookguru.online/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline"
          >
            WebhookGuru
          </a>
        </p>
        <div className="flex flex-col gap-4">
          <div className="sm:col-span-2">
            <FormLabelWithHelp
              htmlFor={`al-wh-url-${projectId}`}
              description={t(
                'Endpoint HTTPS que receberá POST com JSON quando o canal Webhook estiver ativo.',
                'HTTPS endpoint that will receive JSON POST payloads when the Webhook channel is enabled.',
              )}
              value={webhookUrl}
            >
              {t('URL do webhook', 'Webhook URL')}
            </FormLabelWithHelp>
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
            <FormLabelWithHelp
              htmlFor={`al-wh-sec-${projectId}`}
              description={t(
                'Segredo compartilhado para sua API validar que o POST veio do monitor; armazenado criptografado. Deixe em branco para manter.',
                'Shared secret so your API can verify the POST came from the monitor; stored encrypted. Leave blank to keep.',
              )}
              value={maskSecretInput(webhookSecret)}
            >
              {t('Segredo do webhook (em branco para manter)', 'Webhook secret (leave blank to keep)')}
            </FormLabelWithHelp>
            <input
              id={`al-wh-sec-${projectId}`}
              type="password"
              className={inputClass}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setShowWebhookPayloadFormat((v) => !v)}
              className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg)]/80"
            >
              {showWebhookPayloadFormat ? (
                <>
                  <EyeSlash size="18" variant="Outline" />
                  {t('Ocultar formato do payload', 'Hide payload format')}
                </>
              ) : (
                <>
                  <Eye size="18" variant="Outline" />
                  {t('Ver formato do payload', 'View payload format')}
                </>
              )}
            </button>
            {showWebhookPayloadFormat ? (
              <div className="mt-4 space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-4">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t('Método', 'Method')}: <code className="font-mono text-[var(--color-text-primary)]">POST</code>
                  {' · '}
                  {t('Corpo', 'Body')}:{' '}
                  <code className="font-mono text-[var(--color-text-primary)]">
                    {WEBHOOK_ALERT_REQUEST_HEADERS.contentType}
                  </code>
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t(
                    'Se um segredo estiver salvo no projeto, cada requisição inclui o header',
                    'When a secret is saved on the project, each request includes header',
                  )}{' '}
                  <code className="rounded bg-[var(--color-surface)] px-1 font-mono text-[var(--color-text-primary)]">
                    {WEBHOOK_ALERT_REQUEST_HEADERS.secretHeaderName}
                  </code>{' '}
                  {t('com o mesmo valor.', 'with the same value.')}
                </p>
                <div>
                  <p className="mb-1 text-xs font-medium text-[var(--color-text-primary)]">
                    {t('Falha (alerta)', 'Failure (alert)')}
                  </p>
                  <pre className="max-h-64 overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs leading-relaxed text-[var(--color-text-primary)]">
                    {webhookAlertPayloadExamples.failure}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-[var(--color-text-primary)]">
                    {t('Recuperação', 'Recovery')}
                  </p>
                  <pre className="max-h-64 overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs leading-relaxed text-[var(--color-text-primary)]">
                    {webhookAlertPayloadExamples.resolved}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-6">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-text)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Save2 size="18" variant="Outline" />
          {loading ? t('Salvando…', 'Saving…') : t('Salvar alertas', 'Save alert settings')}
        </button>
        {ok ? <p className="text-sm text-[var(--color-success)]">{ok}</p> : null}
        {msg ? <p className="text-sm text-[var(--color-error)]">{msg}</p> : null}
      </div>
    </form>
  );
}
