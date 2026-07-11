'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout, getUser } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSidebarConfig } from '@/lib/navigation';

function UserMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setUser(getUser()); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {user?.nom?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-white text-sm font-medium truncate">{user?.nom ?? 'Utilisateur'}</p>
          <p className="text-white/50 text-xs truncate">{user?.email ?? ''}</p>
        </div>
        <svg className={`w-4 h-4 text-white/50 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden animate-fade-in z-50">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.nom}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            <button onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const path = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const { nav, roleLabel, roleColor } = getSidebarConfig(user.role || '');

  return (
    <aside className="w-64 bg-gradient-sidebar flex flex-col fixed h-full z-20 shadow-soft">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Afrika Influence</p>
            <p className="text-white/50 text-xs">Hub</p>
          </div>
        </Link>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColor}`}>
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

      {/* User menu at bottom */}
      <div className="px-3 py-4 border-t border-white/10">
        <UserMenu />
      </div>
    </aside>
  );
}
