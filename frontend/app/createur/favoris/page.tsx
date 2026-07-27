'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardCreateur from '@/components/layout/DashboardCreateur';
import AuthGuard from '@/components/auth/AuthGuard';
import { favoriApi, formatFCFA, getImageUrl } from '@/lib/api';
import { showToast } from '@/components/ui/Toast';
import SafeAvatar from '@/components/ui/SafeAvatar';

interface Campagne {
  id: string;
  titre: string;
  description?: string;
  budget: number;
  nombreCreateursVoulus?: number;
  statut: string;
  dateFin?: string;
  plateformes?: Array<{ plateforme: string }>;
  entreprise: { id: string; nom: string; logoUrl?: string; secteur?: string; pays?: string };
}

const STATUT_LABEL: Record<string, string> = {
  PUBLIEE: 'Publiée', BROUILLON: 'Brouillon', ANNULEE: 'Annulée',
  EN_COURS: 'En cours', TERMINEE: 'Terminée',
};

export default function FavorisPage() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [loading, setLoading] = useState(true);

  const charger = () => {
    setLoading(true);
    favoriApi.lister()
      .then((data: any) => setCampagnes(Array.isArray(data) ? data : []))
      .catch((e) => showToast('❌ ' + e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const handleRetirer = async (campagneId: string) => {
    try {
      await favoriApi.retirer(campagneId);
      setCampagnes((prev) => prev.filter((c) => c.id !== campagneId));
      showToast('Retiré des favoris.', 'info');
    } catch (e: any) {
      showToast('❌ ' + e.message, 'error');
    }
  };

  return (
    <AuthGuard roles={['CREATEUR']}>
      <DashboardCreateur>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-brand-600">Mes favoris</h1>
            <p className="text-gray-600 mt-1">Les campagnes que vous avez enregistrées pour plus tard</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-3xl shadow-bento p-6 animate-pulse">
                  <div className="h-20 bg-gray-100 rounded-2xl mb-4" />
                  <div className="h-4 bg-gray-100 rounded mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : campagnes.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-bento p-16 text-center">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun favori pour l'instant</h3>
              <p className="text-gray-400 text-sm mb-6">Enregistrez une campagne depuis la marketplace pour la retrouver ici.</p>
              <Link href="/createur/campagnes" className="text-brand-600 hover:underline text-sm font-medium">
                → Parcourir les campagnes
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campagnes.map((campagne) => (
                <div key={campagne.id} className="relative bg-white rounded-3xl shadow-bento p-6 hover-lift transition-all border border-transparent hover:border-brand-200">
                  <button
                    onClick={() => handleRetirer(campagne.id)}
                    title="Retirer des favoris"
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-lg hover:scale-110 transition-transform"
                  >
                    ⭐
                  </button>

                  <div className="flex items-start gap-4 mb-4">
<<<<<<< Updated upstream
                    <div className="w-16 h-16 rounded-2xl bg-brand-50 border-2 border-brand-100 flex items-center justify-center flex-shrink-0">
                      {campagne.entreprise?.logoUrl ? (
                        <img src={getImageUrl(campagne.entreprise.logoUrl)} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <span className="text-2xl font-bold text-brand-600">{campagne.entreprise?.nom?.[0] || 'E'}</span>
                      )}
                    </div>
=======
                    <SafeAvatar
                      src={campagne.entreprise?.logoUrl}
                      name={campagne.entreprise?.nom}
                      className="w-16 h-16 rounded-2xl"
                      textClassName="text-2xl font-bold text-brand-600"
                    />
>>>>>>> Stashed changes
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{campagne.titre}</h3>
                      <p className="text-sm text-gray-400 truncate">{campagne.entreprise?.nom}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                        {STATUT_LABEL[campagne.statut] || campagne.statut}
                      </span>
                    </div>
                  </div>

                  {campagne.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{campagne.description}</p>
                  )}

                  <div className="bg-brand-50 rounded-xl p-3 text-center mb-4">
                    <div className="font-display font-bold text-brand-600">{formatFCFA(campagne.budget)}</div>
                    <div className="text-xs text-gray-500">Budget</div>
                  </div>

                  <Link href="/createur/campagnes"
                    className="block w-full py-2.5 bg-gradient-brand text-white rounded-2xl font-semibold hover:opacity-90 transition-all text-sm text-center">
                    Voir dans la marketplace
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardCreateur>
    </AuthGuard>
  );
}
