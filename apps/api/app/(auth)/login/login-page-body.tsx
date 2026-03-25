'use client';

import Link from 'next/link';
import { getProviders, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useT } from '@/components/i18n/i18n-provider';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { AUTH_ERROR_HINTS, normalizeAuthErrorParam } from '@/lib/auth-error-messages';

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

/** Build E.164: +DDI + national digits (no spaces). */
function buildE164FromDdiAndNumber(ddiRaw: string, nationalRaw: string): string {
  const ddi = ddiRaw.replace(/\D/g, '');
  const national = nationalRaw.replace(/\D/g, '');
  if (!ddi || !national) {
    return '';
  }
  return `+${ddi}${national}`;
}

function isValidE164(phone: string): boolean {
  return /^\+\d{10,15}$/.test(phone);
}

export function LoginPageBody() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = normalizeAuthErrorParam(searchParams.get('error'));
  const hint = code ? AUTH_ERROR_HINTS[code] ?? AUTH_ERROR_HINTS.Default : null;
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const hintResolved = hint ? t(hint.pt, hint.en).replaceAll('{origin}', origin) : null;

  const [whatsappOtpAvailable, setWhatsappOtpAvailable] = useState(false);
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [ddiInput, setDdiInput] = useState('');
  const [nationalNumberInput, setNationalNumberInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const composedWhatsappE164 = buildE164FromDdiAndNumber(ddiInput, nationalNumberInput);
  const whatsappE164Valid = isValidE164(composedWhatsappE164);

  useEffect(() => {
    getProviders().then((p) => {
      if (p?.['whatsapp-otp']) {
        setWhatsappOtpAvailable(true);
      }
    });
  }, []);

  async function handleSendOtp() {
    setOtpError(null);
    const phone = buildE164FromDdiAndNumber(ddiInput, nationalNumberInput);
    if (!isValidE164(phone)) {
      setOtpError(
        t(
          'Indique um DDI e um número válidos (E.164: + e 10 a 15 dígitos no total).',
          'Enter a valid country code and number (E.164: + and 10–15 digits total).',
        ),
      );
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/whatsapp-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: unknown };
        const msg =
          typeof data.error === 'string'
            ? data.error
            : t('Não foi possível enviar o código.', 'Could not send the code.');
        setOtpError(msg);
        return;
      }
      setOtpStep('code');
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setOtpError(null);
    const phone = buildE164FromDdiAndNumber(ddiInput, nationalNumberInput);
    if (!isValidE164(phone)) {
      setOtpError(
        t(
          'Indique um DDI e um número válidos.',
          'Enter a valid country code and number.',
        ),
      );
      return;
    }
    setOtpLoading(true);
    try {
      const res = await signIn('whatsapp-otp', {
        phone,
        code: otpCode.trim(),
        redirect: false,
        callbackUrl: '/dashboard',
      });
      if (res?.error) {
        setOtpError(t('Código inválido ou expirado.', 'Invalid or expired code.'));
        return;
      }
      if (res?.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    } finally {
      setOtpLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-6 flex w-full max-w-md justify-end">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
        <h1 className="mb-2 text-xl font-semibold">{t('Entrar', 'Sign in')}</h1>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          {whatsappOtpAvailable
            ? t(
                'Use Google, GitHub ou informe o DDI e o número (receberá um código no WhatsApp).',
                'Use Google, GitHub, or enter country code (DDI) and phone number (you will receive a code on WhatsApp).',
              )
            : t(
                'Use sua conta Google ou GitHub para acessar o painel.',
                'Use your Google or GitHub account to access the dashboard.',
              )}
        </p>
        {code ? (
          <div
            role="alert"
            className="mb-6 rounded-md border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-text-primary)]"
          >
            <p className="font-mono text-xs text-[var(--color-text-muted)]">{code}</p>
            {hintResolved ? (
              <p className="mt-2 text-sm">{hintResolved}</p>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="flex items-center justify-center gap-3 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]"
          >
            <GoogleLogo className="h-5 w-5 shrink-0" />
            {t('Continuar com Google', 'Continue with Google')}
          </button>
          <button
            type="button"
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="flex items-center justify-center gap-3 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]"
          >
            <GitHubLogo className="h-5 w-5 shrink-0" />
            {t('Continuar com GitHub', 'Continue with GitHub')}
          </button>
        </div>
        {whatsappOtpAvailable ? (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                <span className="bg-[var(--color-surface)] px-2">{t('Ou', 'Or')}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {t('Entrar com WhatsApp', 'Sign in with WhatsApp')}
              </p>
              {otpError ? (
                <div
                  role="alert"
                  className="rounded-md border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-text-primary)]"
                >
                  {otpError}
                </div>
              ) : null}
              {otpStep === 'phone' ? (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[7rem]">
                      <label
                        htmlFor="login-whatsapp-ddi"
                        className="text-xs font-medium text-[var(--color-text-muted)]"
                      >
                        {t('DDI', 'Country code')}
                      </label>
                      <input
                        id="login-whatsapp-ddi"
                        type="text"
                        name="ddi"
                        inputMode="numeric"
                        autoComplete="tel-country-code"
                        placeholder={t('ex.: 55', 'e.g. 55')}
                        value={ddiInput}
                        onChange={(e) =>
                          setDdiInput(e.target.value.replace(/\D/g, '').slice(0, 3))
                        }
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <label
                        htmlFor="login-whatsapp-national"
                        className="text-xs font-medium text-[var(--color-text-muted)]"
                      >
                        {t('Número', 'Number')}
                      </label>
                      <input
                        id="login-whatsapp-national"
                        type="tel"
                        name="phone"
                        autoComplete="tel-national"
                        placeholder={t('ex.: 11999999999', 'e.g. 11999999999')}
                        value={nationalNumberInput}
                        onChange={(e) =>
                          setNationalNumberInput(
                            e.target.value.replace(/\D/g, '').slice(0, 15),
                          )
                        }
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {t(
                      'Será usado o formato +DDI seguido do número, sem espaços.',
                      'The app will use +country code followed by the number, no spaces.',
                    )}
                  </p>
                  <button
                    type="button"
                    disabled={otpLoading || !whatsappE164Valid}
                    onClick={() => void handleSendOtp()}
                    className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {otpLoading
                      ? t('A enviar…', 'Sending…')
                      : t('Enviar código', 'Send code')}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {t('Código enviado para', 'Code sent to')}{' '}
                    <span className="font-mono">{composedWhatsappE164}</span>
                    .{' '}
                    <button
                      type="button"
                      className="text-[var(--color-accent)] underline"
                      onClick={() => {
                        setOtpStep('phone');
                        setOtpCode('');
                        setOtpError(null);
                      }}
                    >
                      {t('Alterar número', 'Change number')}
                    </button>
                  </p>
                  <label htmlFor="login-whatsapp-otp" className="sr-only">
                    {t('Código de verificação', 'Verification code')}
                  </label>
                  <input
                    id="login-whatsapp-otp"
                    type="text"
                    name="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder={t('000000', '000000')}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-lg tracking-widest text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                  />
                  <button
                    type="button"
                    disabled={otpLoading || otpCode.length !== 6}
                    onClick={() => void handleVerifyOtp()}
                    className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {otpLoading ? t('A entrar…', 'Signing in…') : t('Entrar', 'Sign in')}
                  </button>
                </>
              )}
            </div>
          </>
        ) : null}
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          <Link href="/" className="text-[var(--color-accent)] hover:underline">
            {t('Voltar ao início', 'Back to home')}
          </Link>
        </p>
      </div>
    </div>
  );
}
