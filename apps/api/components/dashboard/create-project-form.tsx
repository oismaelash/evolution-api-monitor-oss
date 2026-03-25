'use client';

import { ArrowDown2 } from 'iconsax-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createProjectSchema } from '@monitor/shared';
import { useT } from '@/components/i18n/i18n-provider';
import { apiErrorMessage } from '@/components/dashboard/api-error-message';

const labelClass = 'mb-1 block text-sm font-medium text-[var(--color-text-muted)]';
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
  const [alertPhone, setAlertPhone] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const raw = {
      name: name.trim(),
      evolutionUrl: evolutionUrl.trim(),
      evolutionApiKey: evolutionApiKey.trim(),
      alertPhone: alertPhone.trim() || undefined,
    };
    const parsed = createProjectSchema.safeParse(raw);
    if (!parsed.success) {
      setMsg(parsed.error.errors.map((x) => x.message).join(' · '));
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
      onSubmit={(e) => void onSubmit(e)}
      className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <button
        type="button"
        id="create-project-heading"
        aria-expanded={open}
        aria-controls="create-project-panel"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-[var(--color-bg)]/40 sm:px-6"
      >
        <span className="text-lg font-medium text-[var(--color-text-primary)]">
          {t('Novo projeto', 'New project')}
        </span>
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
        className={open ? 'border-t border-[var(--color-border)] px-6 pb-6 pt-4' : undefined}
      >
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          {t(
            'Um servidor Evolution por projeto: URL base e API key global (igual ao Evolution Manager).',
            'One Evolution server per project: base URL and global API key (same as Evolution Manager).',
          )}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="proj-name">
              {t('Nome', 'Name')}
            </label>
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
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="proj-url">
              {t('URL base da Evolution API', 'Evolution API base URL')}
            </label>
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
            <label className={labelClass} htmlFor="proj-key">
              {t('API key da Evolution', 'Evolution API key')}
            </label>
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
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="proj-alert">
              {t('Telefone de alerta (E.164, opcional)', 'Alert phone (E.164, optional)')}
            </label>
            <input
              id="proj-alert"
              className={inputClass}
              value={alertPhone}
              onChange={(e) => setAlertPhone(e.target.value)}
              placeholder="+5511999999999"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? t('Criando…', 'Creating…') : t('Criar projeto', 'Create project')}
          </button>
          {msg ? <p className="text-sm text-[var(--color-error)]">{msg}</p> : null}
        </div>
      </div>
    </form>
  );
}
