'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { 
  Element3, 
  FolderCloud, 
  DocumentText, 
  EmptyWallet, 
  Logout, 
  ArrowLeft2, 
  ArrowRight2,
  Global
} from 'iconsax-react';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Load collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const nav = [
    { 
      href: '/dashboard', 
      label: t('Painel', 'Dashboard'),
      icon: Element3
    },
    { 
      href: '/projects', 
      label: t('Projetos', 'Projects'),
      icon: FolderCloud
    },
    { 
      href: '/logs', 
      label: t('Logs', 'Logs'),
      icon: DocumentText
    },
    { 
      href: '/settings/billing', 
      label: t('Cobrança', 'Billing'),
      icon: EmptyWallet
    },
  ];

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

  return (
    <div className="relative flex min-h-screen bg-[var(--color-bg)] transition-colors duration-300">
      {requiresDisplayName ? <WhatsAppDisplayNameModal /> : null}
      
      <aside 
        className={`${sidebarWidth} sticky top-0 h-screen shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col transition-all duration-300 ease-in-out z-40`}
      >
        {/* Logo / Branding */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20">
            <Global size="24" variant="Bold" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                Evolution
                <span className="text-[var(--color-accent)]">Monitor</span>
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <div className={`mb-6 px-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {!isCollapsed && (
            <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              {t('Idioma', 'Language')}
            </p>
          )}
          <LanguageSwitcher isCollapsed={isCollapsed} />
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 flex-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center transition-all duration-200 
                  ${isCollapsed ? 'h-11 w-11 justify-center rounded-xl' : 'gap-3 rounded-xl px-3 py-2.5'}
                  ${active
                    ? 'bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/10'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/40 hover:text-[var(--color-text-primary)]'
                  }`}
              >
                <div className={`flex shrink-0 items-center justify-center ${isCollapsed ? 'h-full w-full' : ''}`}>
                  <Icon 
                    size="22" 
                    variant={active ? "Bold" : "Outline"} 
                    color={active ? "#ffffff" : "#94a3b8"}
                    className={`transition-all duration-200 ${!active ? 'group-hover:scale-110 group-hover:text-[#f8fafc]' : ''}`}
                  />
                </div>
                
                {!isCollapsed && (
                  <span className="overflow-hidden whitespace-nowrap text-sm font-medium">{item.label}</span>
                )}
                
                {active && !isCollapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
                )}

                {/* Custom Tooltip for Collapsed State */}
                {isCollapsed && (
                  <div className="pointer-events-none absolute left-full z-50 ml-4 hidden whitespace-nowrap rounded-lg bg-gray-900/95 px-3 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-sm transition-all group-hover:block animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-gray-900/95" />
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User & Footer */}
        <div className="mt-auto border-t border-[var(--color-border)] pt-4 px-2">
          <div className={`mb-4 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
                  {userName ?? t('Conta', 'Account')}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className={`group relative flex items-center justify-center rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-500 ${isCollapsed ? 'w-full' : ''}`}
            >
              <Logout 
                size="20" 
                variant="Outline" 
                color="#94a3b8"
                className="transition-colors group-hover:text-red-500"
              />
              {!isCollapsed && <span className="ml-2 text-xs font-medium">{t('Sair', 'Sign out')}</span>}

              {/* Custom Tooltip for Collapsed State */}
              {isCollapsed && (
                <div className="pointer-events-none absolute left-full z-50 ml-6 hidden whitespace-nowrap rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-2xl transition-all group-hover:block animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-red-600" />
                  {t('Sair', 'Sign out')}
                </div>
              )}
            </button>
          </div>

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-2 text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
          >
            {isCollapsed ? (
              <ArrowRight2 size="18" variant="Outline" />
            ) : (
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <ArrowLeft2 size="18" variant="Outline" />
                <span>{t('Recolher', 'Collapse')}</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-[var(--color-bg)]">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
