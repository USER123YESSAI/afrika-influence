'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import { getMesCampagnes, type Campagne } from '@/lib/api';
import CampagneCard from '@/components/campagne/CampagneCard';

const STATUTS: { value: string; label: string }[] = [
  { value: '', label: 'Toutes' },
  { value: 'BROUILLON', label: 'Brouillon' },
  { value: 'PUBLIEE', label: 'Publiée' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'EN_ATTENTE_VALIDATION', label: 'En attente' },
  { value: 'TERMINEE', label: 'Terminée' },
  { value: 'ANNULEE', label: 'Annulée' },
];

export default function CampagnesPageClient() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const searchParams = useSearchParams();
  const [filtre, setFiltre] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (statut?: string) => {
    setLoading(true);
    getMesCampagnes(statut || undefined)
      .then(setCampagnes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const statut = searchParams?.get('statut') || '';
    setFiltre(statut);
    load(statut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFiltre = (val: string) => {
    setFiltre(val);
    load(val);
  };

  return (
    <DashboardEntreprise>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-brand-600">Mes campagnes</h1>
          <Link
            href="/campagnes/nouvelle"
            className="bg-gradient-brand text-white px-4 py-2 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-bento hover-lift"
          >
            + Nouvelle
          </Link>
        </div>

        {/* Filtres statut */}
        <div className="flex gap-2 flex-wrap mb-6">
          {STATUTS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleFiltre(s.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all hover-lift ${
                filtre === s.value
                  ? 'bg-gradient-brand text-white shadow-bento'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-700 bg-red-50 px-4 py-3 rounded-2xl text-sm mb-4">{error}</p>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Chargement…</div>
        ) : campagnes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">Aucune campagne trouvée</p>
            <Link
              href="/campagnes/nouvelle"
              className="text-brand-600 hover:underline text-sm font-medium"
            >
              Créer ma première campagne →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campagnes.map((c) => (
              <CampagneCard
                key={c.id}
                campagne={c}
                onRefresh={() => load(filtre)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardEntreprise>
  );
}

