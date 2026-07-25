'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { getUser } from '@/lib/api';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const user = typeof window !== 'undefined' ? getUser() : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main content */}
      <div className="ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-gray-500">
                  Bienvenue, {user?.nom || 'Utilisateur'}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                {/* Profile */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.nom?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{user?.nom || 'Utilisateur'}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase() || 'Visiteur'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function getPageTitle(): string {
  if (typeof window === 'undefined') return 'Tableau de bord';
  
  const path = window.location.pathname;
  const titles: Record<string, string> = {
    '/dashboard': 'Tableau de bord',
    '/campagnes': 'Campagnes',
    '/collaborations': 'Collaborations',
    '/messages': 'Messages',
    '/paiements': 'Paiements',
    '/createur/offres': 'Mes Offres',
    '/createur/profil': 'Mon Profil',
    '/admin/utilisateurs': 'Utilisateurs',
    '/admin/campagnes': 'Campagnes',
    '/admin/signalements': 'Signalements',
    '/admin/logs': 'Logs',
    '/moderateur/profils': 'Profils',
    '/moderateur/campagnes': 'Campagnes',
    '/moderateur/contenus': 'Contenus',
    '/moderateur/signalements': 'Signalements',
    '/parametres': 'Paramètres',
  };

  // Check for exact match first
  if (titles[path]) return titles[path];

  // Check for partial matches
  for (const [key, value] of Object.entries(titles)) {
    if (path.startsWith(key)) return value;
  }

  return 'Tableau de bord';
}
