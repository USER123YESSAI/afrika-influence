'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { getSidebarConfig } from '@/lib/navigation';
import { Logo } from '@/components/Logo';

export default function Sidebar() {
  const path = usePathname();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const { nav, roleLabel, roleColor } = getSidebarConfig(user.role || '');

  return (
    <aside className="w-64 bg-gradient-sidebar flex flex-col fixed h-full z-20 shadow-soft">
      {/* Logo — ramène vers l'espace de landing tout en restant connecté */}
      <div className="px-5 py-6 border-b border-[rgba(255,255,255,0.1)]">
        <Link
          href="/"
          className="flex items-center rounded-xl transition-opacity hover:opacity-80"
          aria-label="Retour à l'accueil Afrika Influence Hub"
        >
          <Logo variant="light" />
        </Link>
        <span className={`mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColor}`}>
          {roleLabel}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {nav.map((item) => {
          const active = path === item.href || (item.href !== '/' && path.startsWith(item.href + '/'));
          return (
            <Link key={item.href} href={item.href}
              className={`sidebar-link ${active ? 'active' : ''}`}>
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Bascule clair/sombre — la sidebar reste sombre en permanence (voir
          globals.css / tailwind.config.js), donc les couleurs ici sont en
          blanc littéral (arbitraire) plutôt qu'en `text-white`/`bg-white`
          Tailwind, qui elles SUIVENT le thème (--c-surface) et deviennent
          quasi-noires en mode sombre — c'est ce qui rendait ce bouton
          invisible. Fond + bordure visibles au repos (pas seulement au
          survol) pour bien lire un bouton, pas juste du texte. */}
      <div className="px-3 py-4 border-t border-[rgba(255,255,255,0.1)]">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
            text-[rgba(255,255,255,0.85)]
            bg-[rgba(255,255,255,0.06)]
            border border-[rgba(255,255,255,0.14)]
            shadow-sm
            hover:bg-[rgba(255,255,255,0.16)] hover:text-[#ffffff] hover:border-[rgba(255,255,255,0.24)]
            active:bg-[rgba(255,255,255,0.22)]
            transition-all duration-200"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 flex-shrink-0" strokeWidth={2} /> : <Moon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />}
          <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
        </button>
      </div>
    </aside>
  );
}