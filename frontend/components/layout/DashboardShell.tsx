'use client';
import AuthGuard, { type AuthRole } from '@/components/auth/AuthGuard';
import TopBar from '@/components/layout/TopBar';

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  nav?: any[]; // Ignored, kept for backward compatibility
  role?: string; // Ignored
  roleLabel?: string; // Ignored
  roleColor?: string; // Ignored
  profileHref?: string;
  authRoles: AuthRole[];
}

export default function DashboardShell({
  children,
  title,
  subtitle,
  profileHref,
  authRoles,
}: DashboardShellProps) {
  return (
    <AuthGuard roles={authRoles}>
      <TopBar title={title} subtitle={subtitle} profileHref={profileHref} />
      <main className="flex-1 p-8">{children}</main>
    </AuthGuard>
  );
}
