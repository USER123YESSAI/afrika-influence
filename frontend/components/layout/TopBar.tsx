'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { User as UserIcon, LogOut } from 'lucide-react';
import NotificationsBell from '@/components/ui/NotificationsBell';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/api';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  profileHref?: string;
}

export default function TopBar({ title, subtitle, profileHref }: TopBarProps) {
  const { user, logout } = useAuth();
  const [dropdownOuvert, setDropdownOuvert] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOuvert(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getProfileLink = () => {
    if (!user) return "/connexion";
    // Priorité à la destination explicitement fournie par le DashboardXxx
    // appelant (ex: Admin/Modérateur n'ont pas de page "profil", ils sont
    // renvoyés vers leur propre tableau de bord).
    if (profileHref) return profileHref;
    switch (user.role) {
      case "CREATEUR": return "/createur/profil";
      case "ENTREPRISE":
      case "PARTICULIER": return "/entreprise/profil";
      default: return "/";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-gray-900">Mon espace</span>
        {title && <div className="h-5 w-px bg-gray-300"></div>}
        <div>
          {title  && <h2 className="font-medium text-gray-600 text-sm">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <NotificationsBell />

        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOuvert(!dropdownOuvert)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white pl-2 pr-4 py-1.5 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan to-emerald text-xs font-bold text-ink overflow-hidden">
                {user?.photoProfil || user?.logo || user?.photo ? (
                  <img src={getImageUrl(user.photoProfil || user.logo || user.photo)} alt={user.nom} className="w-full h-full object-cover" />
                ) : (
                  user.nom?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">{user.nom}</span>
            </button>

            {dropdownOuvert && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl animate-fade-in">
                <Link
                  href={getProfileLink()}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  onClick={() => setDropdownOuvert(false)}
                >
                  <UserIcon size={16} />
                  Mon profil
                </Link>
                <div className="h-px bg-gray-100" />
                <button
                  onClick={() => {
                    setDropdownOuvert(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}