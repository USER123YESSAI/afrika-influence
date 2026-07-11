'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import TopBar from '@/components/layout/TopBar';

export default function DashboardModerateur({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  return (
    <AuthGuard roles={['MODERATEUR']}>
      <TopBar title={title} subtitle={subtitle} profileHref="/moderateur/dashboard" />
      <div className="p-8">{children}</div>
    </AuthGuard>
  );
}
