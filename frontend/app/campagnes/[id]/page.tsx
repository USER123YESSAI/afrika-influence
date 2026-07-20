'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  getCampagne,
  getRecommandations,
  getProgressionCampagne,
  formatFCFA,
  collabApi,
  type Campagne,
  type Recommandation,
  type ProgressionCampagne,
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
  const [progression, setProgression] = useState<ProgressionCampagne | null>(null);
  const [loadingReco, setLoadingReco] = useState(false);
  const [error, setError] = useState('');
  const [inviting, setInviting] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCampagne(id)
      .then(setCampagne)
      .catch((e) => setError((e as Error).message));
    getProgressionCampagne(id)
      .then(setProgression)
      .catch(() => {}); // non bloquant — une campagne encore BROUILLON n'a simplement rien à montrer
  }, [id]);

  const chargerRecommandations = () => {
    setLoadingReco(true);
    getRecommandations(id)
      .then(setRecommandations)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoadingReco(false));
  };

  const handleInviter = async (createurId: string) => {
    setInviting(createurId);
    try {
      await collabApi.inviter({ campagneId: id, createurId });
      setInvitedIds((prev) => new Set(prev).add(createurId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setInviting(null);
    }
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
            ['Budget total', fmt(campagne.budget ?? 0)],
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

        {/* Progression des livrables */}
        {progression && progression.totalPrevu > 0 && (
          <div className="bg-white rounded-3xl shadow-bento p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Progression des livrables</h2>
              <span className="text-sm font-bold text-gray-900">
                {progression.totalLivre} / {progression.totalPrevu} posts livrés
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-5">
              <div
                className="h-3 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progression.totalPrevu > 0 ? (progression.totalLivre / progression.totalPrevu) * 100 : 0}%` }}
              />
            </div>

            <div className="space-y-3">
              {progression.parCreateur.map((p) => (
                <div key={p.collaborationId} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                    {p.createur?.nom?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800 truncate">{p.createur?.nom}</span>
                      <span className="text-gray-500 text-xs shrink-0 ml-2">
                        {p.quantiteLivree}/{p.quantitePrevue} · {formatFCFA(p.montantValide)} / {formatFCFA(p.montantEngage)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-emerald-400"
                        style={{ width: `${p.quantitePrevue > 0 ? (p.quantiteLivree / p.quantitePrevue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                <CreateurRecommande
                  key={r.id}
                  recommandation={r}
                  rank={i + 1}
                  actionButton={
                    <button
                      onClick={() => handleInviter(r.createurId)}
                      disabled={inviting === r.createurId || invitedIds.has(r.createurId)}
                      className="w-full py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                    >
                      {inviting === r.createurId ? 'Envoi…' : invitedIds.has(r.createurId) ? '✓ Invité' : 'Inviter'}
                    </button>
                  }
                />
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

