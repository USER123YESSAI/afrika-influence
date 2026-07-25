'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
      aria-label={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface/50 text-fog transition-colors hover:text-cyan hover:bg-cyan/10 ${className}`}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" strokeWidth={2} /> : <Moon className="w-4 h-4" strokeWidth={2} />}
    </button>
  );
}
