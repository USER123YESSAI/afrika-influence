'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import TopBar from '@/components/layout/TopBar';

export default function DashboardAdmin({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  return (
    <AuthGuard roles={['ADMINISTRATEUR']}>
      <TopBar title={title} subtitle={subtitle} profileHref="/admin/dashboard" />
      <div className="p-8">{children}</div>
    </AuthGuard>
  );
}
