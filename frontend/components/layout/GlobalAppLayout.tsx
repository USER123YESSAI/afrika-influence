'use client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from './Navbar';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export function GlobalAppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith('/connexion') || pathname.startsWith('/inscription') || pathname.startsWith('/reinitialiser-mdp');
  const isOnboardingPage = pathname.startsWith('/onboarding');
  const isLegalPage = pathname.startsWith('/conditions-utilisation') || pathname.startsWith('/politique-confidentialite');
  const isLandingPage = pathname === '/';
  const isPublicList = pathname.startsWith('/createurs') || pathname.startsWith('/entreprises');

  const isPublicRoute = isAuthPage || isOnboardingPage || isLegalPage || isLandingPage || isPublicList;

  // Pendant la validation du token au chargement initial (AuthContext.loading),
  // on ne sait pas encore si l'utilisateur est connecté. Sur une route qui
  // n'est pas publique, on affiche un écran neutre plutôt que la Navbar
  // publique — sinon les boutons Connexion/Inscription apparaissent une
  // fraction de seconde avant que la Sidebar ne prenne le relais.
  if (loading && !isPublicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan/30 border-t-cyan" />
      </div>
    );
  }

  const showSidebar = user && !isPublicRoute;

  if (!showSidebar) {
    return (
      <div className="flex flex-col min-h-screen">
        {!isAuthPage && !isOnboardingPage && !isLegalPage && <Navbar />}
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Utilisateur connecté : Sidebar, contenu décalé de ml-64
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