'use client';
import { useEffect, useState } from 'react';
import NotificationsBell from '@/components/ui/NotificationsBell';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  profileHref?: string;
}

export default function TopBar({ title, subtitle, profileHref = '/createur/profil' }: TopBarProps) {
  // Profil is now handled by the global Navbar

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        {title  && <h2 className="font-semibold text-gray-900 text-base">{title}</h2>}
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <NotificationsBell />
      </div>
    </header>
  );
}
