'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import TopBar from '@/components/layout/TopBar';
import { getUser } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function DashboardEntreprise({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  const [role, setRole] = useState<string>('ENTREPRISE');

  useEffect(() => {
    const u = getUser();
    if (u?.role) setRole(u.role);
  }, []);

  const isParticulier = role === 'PARTICULIER';

  return (
    <AuthGuard roles={['ENTREPRISE', 'PARTICULIER']}>
      <TopBar title={title} subtitle={subtitle} profileHref={isParticulier ? '/entreprise/dashboard' : '/entreprise/profil'} />
      <div className="p-8">{children}</div>
    </AuthGuard>
  );
}
