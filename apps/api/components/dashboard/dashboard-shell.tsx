'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useT } from '@/components/i18n/i18n-provider';
import { WhatsAppDisplayNameModal } from '@/components/dashboard/whatsapp-display-name-modal';

export function DashboardShell({
  children,
  userName,
  requiresDisplayName,
}: {
  children: React.ReactNode;
  userName?: string | null;
  requiresDisplayName?: boolean;
}) {
  const pathname = usePathname();
  const t = useT();

  const nav = [
    { href: '/dashboard', label: t('Painel', 'Dashboard') },
    { href: '/onboarding', label: t('Onboarding', 'Onboarding') },
    { href: '/projects', label: t('Projetos', 'Projects') },
    { href: '/logs', label: t('Logs', 'Logs') },
    { href: '/settings/billing', label: t('Cobrança', 'Billing') },
  ];

  return (
    <div className="relative flex min-h-screen">
      {requiresDisplayName ? <WhatsAppDisplayNameModal /> : null}
      <aside className="w-60 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-6 space-y-3">
          <div className="text-sm font-semibold text-[var(--color-accent)]">Evolution Monitor</div>
          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {t('Idioma', 'Language')}
            </p>
            <LanguageSwitcher />
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm ${
                  active
                    ? 'bg-[var(--color-border)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/60'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">
          <div className="mb-2 truncate">{userName ?? t('Conta', 'Account')}</div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-[var(--color-accent)] hover:underline"
          >
            {t('Sair', 'Sign out')}
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-8">{children}</main>
    </div>
  );
}
