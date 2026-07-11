'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import TopBar from '@/components/layout/TopBar';

export default function DashboardCreateur({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  return (
    <AuthGuard roles={['CREATEUR']}>
      <TopBar title={title} subtitle={subtitle} profileHref="/createur/profil" />
      <div className="p-8">{children}</div>
    </AuthGuard>
  );
}
