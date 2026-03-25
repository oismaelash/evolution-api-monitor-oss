'use client';

import React from 'react';
import { Element3, FolderCloud, DocumentText, SearchNormal1, Notification, User, Monitor } from 'iconsax-react';

export function MarketingDashboardMock() {
  const mockBuckets = Array.from({ length: 24 }).map((_, i) => ({
    ts: i,
    ok: Math.floor(Math.random() * 80) + 20,
    fail: Math.random() > 0.8 ? Math.floor(Math.random() * 15) : 0,
  }));

  const max = Math.max(...mockBuckets.map(b => b.ok + b.fail));

  return (
    <div className="flex w-full aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-2xl">
      {/* Sidebar */}
      <aside className="hidden md:flex w-16 lg:w-48 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/50 p-3 lg:p-4">
        <div className="mb-8 flex items-center gap-3 px-1 lg:px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-text)] shadow-lg shadow-[var(--color-accent)]/20">
            <Monitor size="18" variant="Bold" />
          </div>
          <span className="hidden lg:block font-bold tracking-tight text-[var(--color-text-primary)]">Evo <span className="text-[var(--color-accent)]">Monitor</span></span>
        </div>

        <nav className="flex flex-col gap-2">
            {[
              { icon: Element3, label: 'Dashboard', active: true },
              { icon: FolderCloud, label: 'Projetos' },
              { icon: DocumentText, label: 'Logs' },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-lg px-2 lg:px-3 py-2 transition-colors border ${item.active ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-border)]' : 'border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-text-primary)]'}`}
              >
              <item.icon size="20" variant={item.active ? "Bold" : "Outline"} />
              <span className="hidden lg:block text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg)]">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="relative flex-1 max-w-sm">
            <SearchNormal1 size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <div className="h-8 w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] pl-9 pr-3 shadow-sm" />
          </div>
          <div className="flex items-center gap-4 ml-4">
            <Notification size="18" className="text-[var(--color-text-muted)]" />
            <div className="h-8 w-8 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center shadow-sm">
              <User size="16" className="text-[var(--color-text-muted)]" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-6 flex-1 overflow-hidden flex flex-col bg-[var(--color-bg)]">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
            {[
              { label: 'Total', value: '12', color: 'text-[var(--color-text-primary)]' },
              { label: 'Saudáveis', value: '11', color: 'text-[var(--color-success)]' },
              { label: 'Erros', value: '1', color: 'text-[var(--color-error)]' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 lg:p-4 shadow-sm"
              >
                <div className="text-[10px] lg:text-xs text-[var(--color-text-muted)] mb-1 font-medium">{stat.label}</div>
                <div className={`text-lg lg:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-border)]/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)]">Status nas últimas 24h</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                  <span className="text-[10px] text-[var(--color-text-muted)] font-medium">OK</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-error)]" />
                  <span className="text-[10px] text-[var(--color-text-muted)] font-medium">Falha</span>
                </div>
              </div>
            </div>
            <div className="flex h-24 lg:h-32 items-end gap-0.5 lg:gap-1">
              {mockBuckets.map((b, i) => (
                <div key={i} className="flex flex-1 flex-col gap-0.5 justify-end h-full group">
                  <div
                    className="w-full bg-[var(--color-success)]/80 rounded-t-[1px] transition-all hover:bg-[var(--color-success)]"
                    style={{ height: `${(b.ok / max) * 100}%` }}
                  />
                  {b.fail > 0 && (
                    <div
                      className="w-full bg-[var(--color-error)]/80 rounded-b-[1px] transition-all hover:bg-[var(--color-error)]"
                      style={{ height: `${(b.fail / max) * 100}%` }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Table Mockup */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm">
            {[
              { name: 'Suporte VIP', uptime: '99.9%', status: 'success', bgClass: 'bg-[var(--color-success)]', textClass: 'text-[var(--color-success)]' },
              { name: 'Vendas SP', uptime: '98.5%', status: 'warning', bgClass: 'bg-[var(--color-warning)]', textClass: 'text-[var(--color-warning)]' },
              { name: 'Financeiro', uptime: '64.2%', status: 'error', bgClass: 'bg-[var(--color-error)]', textClass: 'text-[var(--color-error)]' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-border)]/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className={`h-1.5 w-1.5 rounded-full ${row.bgClass}`}
                    style={{ boxShadow: `0 0 8px var(--color-${row.status})` }}
                  />
                  <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{row.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block w-16 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div className={`h-full ${row.bgClass}`} style={{ width: row.uptime }} />
                  </div>
                  <span className={`text-xs font-bold ${row.textClass} w-10 text-right`}>{row.uptime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
