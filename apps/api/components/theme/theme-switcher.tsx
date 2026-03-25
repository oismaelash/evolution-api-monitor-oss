'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'iconsax-react';

export function ThemeSwitcher({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5 shadow-sm h-full ${
        isCollapsed ? 'w-full' : ''
      }`}>
        <button className="flex items-center justify-center rounded p-1 min-w-[2.25rem] text-[var(--color-text-muted)] w-full">
          <div className="h-4 w-4 rounded-full bg-[var(--color-border)] animate-pulse" />
        </button>
      </div>
    );
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div className={`inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 shadow-sm h-full ${
      isCollapsed ? 'w-full' : ''
    }`}>
      <button
        onClick={toggleTheme}
        className={`group relative flex items-center justify-center rounded p-1 min-w-[2.25rem] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)]/50 hover:text-[var(--color-text-primary)] w-full`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Moon size="16" color="currentColor" variant="Outline" className="transition-transform group-hover:scale-110" />
        ) : (
          <Sun size="16" color="currentColor" variant="Outline" className="transition-transform group-hover:scale-110" />
        )}
      </button>
    </div>
  );
}
