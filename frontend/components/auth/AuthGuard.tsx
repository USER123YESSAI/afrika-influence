'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export type AuthRole = 'ADMINISTRATEUR' | 'MODERATEUR' | 'CREATEUR' | 'ENTREPRISE' | 'PARTICULIER';

export default function AuthGuard({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: AuthRole[];
}) {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Attendre que le contexte AuthContext soit initialisé
    if (loading) return;

    // Si pas connecté => connexion
    if (!token || !user) {
      router.replace('/connexion');
      return;
    }

    // Si on exige un rôle => vérif
    if (roles?.length) {
      const role = user.role as string | undefined;
      if (!role || !roles.includes(role as AuthRole)) {
        router.replace('/');
        return;
      }
    }

    setReady(true);
  }, [router, roles, token, user, loading]);

  // Afficher un état de chargement pendant l'initialisation
  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

