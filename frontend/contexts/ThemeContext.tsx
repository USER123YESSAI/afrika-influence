'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Le thème sombre (noir / bleu cyan) est la base de la plateforme ; le mode
// clair est une bascule optionnelle. Un script inline dans app/layout.tsx
// applique déjà le bon data-theme sur <html> avant l'hydratation (pour
// éviter un flash de mauvais thème) — ce contexte ne fait que garder l'état
// React synchronisé avec cet attribut et exposer toggleTheme().
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const actuel = (document.documentElement.getAttribute('data-theme') as Theme) || 'dark';
    setTheme(actuel);
  }, []);

  const toggleTheme = () => {
    const suivant: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(suivant);
    document.documentElement.setAttribute('data-theme', suivant);
    try { localStorage.setItem('afrika-theme', suivant); } catch { /* stockage indisponible, pas bloquant */ }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé à l\'intérieur de ThemeProvider');
  return ctx;
}
