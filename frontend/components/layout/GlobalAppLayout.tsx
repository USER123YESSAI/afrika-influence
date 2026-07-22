'use client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from './Navbar';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export function GlobalAppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith('/connexion') || pathname.startsWith('/inscription') || pathname.startsWith('/reinitialiser-mdp');
  const isOnboardingPage = pathname.startsWith('/onboarding');
  const isLegalPage = pathname.startsWith('/conditions-utilisation') || pathname.startsWith('/politique-confidentialite');
  const isLandingPage = pathname === '/';
  const isPublicList = pathname.startsWith('/createurs') || pathname.startsWith('/entreprises');

  const showSidebar = user && !isAuthPage && !isOnboardingPage && !isLegalPage && !isLandingPage && !isPublicList;

  if (!showSidebar) {
    return (
      <div className="flex flex-col min-h-screen">
        {!isAuthPage && !isOnboardingPage && !isLegalPage && <Navbar />}
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // If user is logged in, show Sidebar, and offset the rest of the layout by ml-64
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col min-h-screen relative w-[calc(100%-16rem)]">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
