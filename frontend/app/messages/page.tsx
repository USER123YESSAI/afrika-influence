'use client';
// frontend/app/messages/page.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardCreateur from '@/components/layout/DashboardCreateur';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import { collabApi, getImageUrl, getUser } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';

interface ConvItem {
  id: string;
  campagne: { titre: string };
  createur: { nom: string; photoProfilUrl?: string };
  statut: string;
  dernierMessage?: string;
  nbNonLus?: number;
}

export default function MessagesPage() {
  const [convs, setConvs] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Les conversations = collaborations actives avec messages
    collabApi.lister()
      .then((data: any) => {
        // Filtrer les collabs avec des échanges possibles
        const actives = data.filter((c: any) =>
          !['REFUSEE', 'INVITATION_ENVOYEE'].includes(c.statut)
        );
        setConvs(actives);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const userRole = typeof window !== 'undefined' ? (getUser()?.role ?? '') : '';
  const Shell = (userRole === 'ENTREPRISE' || userRole === 'PARTICULIER') ? DashboardEntreprise : DashboardCreateur;

  return (
    <AuthGuard roles={['CREATEUR', 'ENTREPRISE', 'PARTICULIER']}>
      <Shell>
        <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-brand-600">
            Messages
          </h1>
          <p className="text-gray-600 mt-1">Vos conversations actives</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-white rounded-3xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : convs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-16 text-center">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune conversation</h3>
            <p className="text-gray-400 text-sm">
              Les échanges avec les marques apparaissent ici une fois une collaboration acceptée.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {convs.map((conv) => (
              <Link
                key={conv.id}
                href={`/collaborations/${conv.id}#messages`}
                className="flex items-center gap-4 bg-white rounded-3xl border border-gray-100 shadow-bento p-4 hover:border-brand-200 hover:shadow-md transition-all hover-lift"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 text-xl">
                  {conv.createur?.photoProfilUrl ? (
                    <img src={getImageUrl(conv.createur.photoProfilUrl)} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : '🤝'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate text-sm">
                    {conv.campagne?.titre || 'Campagne'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {conv.dernierMessage || 'Appuyez pour voir les messages'}
                  </div>
                </div>

                {/* Badge non lus */}
                {conv.nbNonLus && conv.nbNonLus > 0 ? (
                  <div className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {conv.nbNonLus}
                  </div>
                ) : (
                  <span className="text-gray-200 flex-shrink-0">→</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
      </Shell>
    </AuthGuard>
  );
}
