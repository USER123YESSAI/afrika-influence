'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  getCampagne,
  getRecommandations,
  type Campagne,
  type Recommandation,
} from '@/lib/api';
import CampagneStatut from '@/components/campagne/CampagneStatut';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import CreateurRecommande from '@/components/recommandation/CreateurRecommande';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' CFA';
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export default function CampagneDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [recommandations, setRecommandations] = useState<Recommandation[]>([]);
  const [loadingReco, setLoadingReco] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCampagne(id)
      .then(setCampagne)
      .catch((e) => setError((e as Error).message));
  }, [id]);

  const chargerRecommandations = () => {
    setLoadingReco(true);
    getRecommandations(id)
      .then(setRecommandations)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoadingReco(false));
  };


  if (error) {
    return (
      <DashboardEntreprise>
        <p className="text-red-700 bg-red-50 px-4 py-3 rounded-2xl">{error}</p>
      </DashboardEntreprise>
    );
  }

  if (!campagne) {
    return (
      <DashboardEntreprise>
        <div className="text-center py-20 text-gray-400">Chargement…</div>
      </DashboardEntreprise>
    );
  }

  return (
    <DashboardEntreprise>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link
                href="/campagnes"
                className="text-sm text-gray-400 hover:text-emerald-600"
              >
                ← Mes campagnes
              </Link>
            </div>
            <h1 className="font-display text-2xl font-bold text-emerald-600">{campagne.titre}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CampagneStatut statut={campagne.statut} />
            {['BROUILLON', 'PUBLIEE'].includes(campagne.statut) && (
              <Link
                href={`/campagnes/${id}/modifier`}
                className="text-sm px-3 py-1.5 border border-gray-200 rounded-2xl hover:bg-gray-50 text-gray-700 hover-lift"
              >
                Modifier
              </Link>
            )}
          </div>
        </div>

        {/* Infos principales */}
        <div className="bg-white rounded-3xl shadow-bento p-6 grid grid-cols-2 gap-4 text-sm">
          {[
            ['Budget total', fmt(campagne.budget)],
            ['Dépensé', fmt(campagne.budgetDepense ?? 0)],
            ['Créateurs voulus', (campagne.nombreCreateursVoulus ?? '—') as any],
            ['Posts / créateur', (campagne.nombrePostsParCreateur ?? '—') as any],
            ['Date début', fmtDate(campagne.dateDebut)],
            ['Date fin', fmtDate(campagne.dateFin)],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-gray-500 text-xs">{label}</p>
              <p className="font-semibold text-gray-900">{String(value)}</p>
            </div>
          ))}
        </div>

        {/* Plateformes */}
        {campagne.plateformes && campagne.plateformes.length > 0 && (
          <div className="bg-white rounded-3xl shadow-bento p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Plateformes cibles</h2>
            <div className="flex flex-wrap gap-2">
              {campagne.plateformes.map((p) => (
                <span
                  key={p.id}
                  className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full font-medium"
                >
                  {p.plateforme}
                </span>
              ))}
            </div>
          </div>
        )}


        {/* Brief */}
        <div className="bg-white rounded-3xl shadow-bento p-6">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Détails du Brief</h2>
          <div className="space-y-6">
            {[
              ['Objectif principal', campagne.objectifPrincipal],
              ['Consignes de contenu', campagne.consignesContenu],
              ['Contraintes', campagne.contraintesContenu],
              ['Exemple de contenu', campagne.exempleContenu],
            ]
              .filter(([, v]) => v)
              .map(([label, val]) => (
                <div key={String(label)}>
                  <h3 className="font-semibold text-gray-900 mb-2">{label}</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{String(val)}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Recommandations */}
        <div className="bg-white rounded-3xl shadow-bento p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Créateurs recommandés</h2>
            <button
              onClick={chargerRecommandations}
              disabled={loadingReco}
              className="text-sm px-4 py-2 bg-gradient-emerald text-white rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-bento hover-lift"
            >
              {loadingReco
                ? 'Analyse…'
                : recommandations.length > 0
                  ? 'Actualiser'
                  : 'Générer les recommandations'}
            </button>
          </div>

          {recommandations.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommandations.map((r, i) => (
                <CreateurRecommande key={r.id} recommandation={r} rank={i + 1} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              Cliquez sur "Générer les recommandations" pour trouver les créateurs les plus compatibles avec cette campagne.
            </p>
          )}
        </div>
      </div>
    </DashboardEntreprise>
  );
}

