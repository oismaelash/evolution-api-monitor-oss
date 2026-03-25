'use client';

import React from 'react';
import {
  Element3,
  FolderCloud,
  DocumentText,
  Global,
  SearchNormal1,
  User,
  Notification,
  Monitor
} from 'iconsax-react';

export function MarketingDashboardMock() {
  const mockBuckets = Array.from({ length: 24 }).map((_, i) => ({
    ts: i,
    ok: Math.floor(Math.random() * 80) + 20,
    fail: Math.random() > 0.8 ? Math.floor(Math.random() * 15) : 0,
  }));

  const max = Math.max(...mockBuckets.map(b => b.ok + b.fail));

  return (
    <div className="flex w-full aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] text-white shadow-2xl">
      {/* Sidebar */}
      <aside className="hidden md:flex w-16 lg:w-48 shrink-0 flex-col border-r border-white/5 bg-[#0f172a]/50 p-3 lg:p-4">
        <div className="mb-8 flex items-center gap-3 px-1 lg:px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
            <Global size="18" variant="Bold" />
          </div>
          <span className="hidden lg:block font-bold tracking-tight">Evo <span className="text-indigo-400">Monitor</span></span>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { icon: Element3, label: 'Painel', active: true },
            { icon: FolderCloud, label: 'Projetos' },
            { icon: DocumentText, label: 'Logs' },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 rounded-lg px-2 lg:px-3 py-2 transition-colors ${item.active ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size="20" variant={item.active ? "Bold" : "Outline"} />
              <span className="hidden lg:block text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#020617]/40">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-white/5">
          <div className="relative flex-1 max-w-sm">
            <SearchNormal1 size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <div className="h-8 w-full rounded-lg bg-white/5 border border-white/5 pl-9 pr-3" />
          </div>
          <div className="flex items-center gap-4 ml-4">
            <Notification size="18" className="text-slate-400" />
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
              <User size="16" className="text-slate-300" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-6 overflow-auto scrollbar-hide">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
            {[
              { label: 'Total', value: '12', color: 'text-white' },
              { label: 'Saudáveis', value: '11', color: 'text-emerald-400' },
              { label: 'Erros', value: '1', color: 'text-rose-400' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/5 bg-white/5 p-3 lg:p-4">
                <div className="text-[10px] lg:text-xs text-slate-500 mb-1">{stat.label}</div>
                <div className={`text-lg lg:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="mb-6 rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-slate-400">Status nas últimas 24h</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-500">OK</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <span className="text-[10px] text-slate-500">Falha</span>
                </div>
              </div>
            </div>
            <div className="flex h-24 lg:h-32 items-end gap-0.5 lg:gap-1">
              {mockBuckets.map((b, i) => (
                <div key={i} className="flex flex-1 flex-col gap-0.5 justify-end h-full group">
                  <div
                    className="w-full bg-emerald-500/80 rounded-t-[1px] transition-all hover:bg-emerald-400"
                    style={{ height: `${(b.ok / max) * 100}%` }}
                  />
                  {b.fail > 0 && (
                    <div
                      className="w-full bg-rose-500/80 rounded-b-[1px] transition-all hover:bg-rose-400"
                      style={{ height: `${(b.fail / max) * 100}%` }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Table Mockup */}
          <div className="rounded-xl border border-white/5 bg-white/5 overflow-hidden">
            {[
              { name: 'Suporte VIP', uptime: '99.9%', status: 'emerald' },
              { name: 'Comercial 01', uptime: '98.5%', status: 'emerald' },
              { name: 'Financeiro', uptime: '64.2%', status: 'rose' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-1.5 w-1.5 rounded-full bg-${row.status}-500 shadow-[0_0_8px_currentColor] text-${row.status}-500`} />
                  <span className="text-xs font-medium truncate">{row.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block w-16 h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full bg-${row.status}-500/50`} style={{ width: row.uptime }} />
                  </div>
                  <span className={`text-xs font-bold text-${row.status}-400 w-10 text-right`}>{row.uptime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
