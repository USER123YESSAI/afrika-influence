'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import { getCampagne, getRecommandations, collabApi, type Campagne, type Recommandation } from '@/lib/api';
import CreateurRecommande from '@/components/recommandation/CreateurRecommande';
import CreateursInvitationTable from '@/components/campagne/CreateursInvitationTable';

export default function InviterPage() {
  const { id } = useParams<{ id: string }>();
  const [campagne, setCampagne]           = useState<Campagne | null>(null);
  const [recommandations, setReco]        = useState<Recommandation[]>([]);
  const [loadingReco, setLoadingReco]     = useState(false);
  const [inviting, setInviting]           = useState<string | null>(null);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [invitedIds, setInvitedIds]       = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    getCampagne(id).then(setCampagne).catch((e: any) => setError(e.message));
  }, [id]);

  const chargerRecommandations = () => {
    if (!id) return;
    setLoadingReco(true); setError('');
    getRecommandations(id)
      .then(setReco)
      .catch((e: any) => setError('Erreur recommandations : ' + e.message))
      .finally(() => setLoadingReco(false));
  };

  const handleInviter = async (createurId: string) => {
    if (!id || !createurId) return;
    setInviting(createurId); setError(''); setSuccess('');
    try {
      await collabApi.inviter({ campagneId: id, createurId });
      setSuccess('✅ Invitation envoyée avec succès !');
      setInvitedIds(prev => new Set(prev).add(createurId));
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'envoi de l\'invitation');
    } finally { setInviting(null); }
  };

  if (!campagne) return (
    <DashboardEntreprise>
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 animate-pulse">Chargement…</div>
      </div>
    </DashboardEntreprise>
  );

  if (campagne.statut !== 'PUBLIEE' && campagne.statut !== 'EN_COURS') return (
    <DashboardEntreprise>
      <div className="max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-800 text-sm">
            ⚠️ Les invitations ne sont disponibles que pour les campagnes publiées ou en cours.
          </p>
        </div>
        <div className="mt-6">
          <Link href={`/campagnes/${id}`} className="text-sm text-gray-400 hover:text-emerald-600">
            ← Retour à la campagne
          </Link>
        </div>
      </div>
    </DashboardEntreprise>
  );

  return (
    <DashboardEntreprise>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/campagnes" className="hover:text-emerald-600">Campagnes</Link>
          <span>›</span>
          <Link href={`/campagnes/${id}`} className="hover:text-emerald-600">{campagne.titre}</Link>
          <span>›</span>
          <span className="text-gray-700">Inviter des créateurs</span>
        </div>

        {error   && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{error}</div>}
        {success && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm">{success}</div>}

        {/* Campaign info */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6 mb-6">
          <h1 className="font-display text-2xl font-bold text-emerald-600 mb-2">Inviter des créateurs</h1>
          <p className="text-gray-500 text-sm mb-4">Sélectionnez les créateurs recommandés ou recherchez par nom.</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Campagne :</span>
            <span className="font-medium text-gray-900">{campagne.titre}</span>
          </div>
          <div className="flex items-center gap-4 text-sm mt-2">
            <span className="text-gray-500">Créateurs voulus :</span>
            <span className="font-medium text-gray-900">{campagne.nombreCreateursVoulus || 'N/A'}</span>
          </div>
        </div>

        {/* Recommandations IA */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Créateurs recommandés par l'IA</h2>
            <button onClick={chargerRecommandations} disabled={loadingReco}
              className="text-sm px-4 py-2 bg-gradient-emerald text-white rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-bento hover-lift">
              {loadingReco ? 'Analyse en cours…' : recommandations.length > 0 ? '🔄 Actualiser' : '✨ Générer les recommandations'}
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
              Cliquez sur "Générer les recommandations" pour trouver les créateurs les plus compatibles.
            </p>
          )}
        </div>

        {/* Tableau de tous les créateurs — recherche, tri, sélection multiple */}
        <div className="mb-6">
          <CreateursInvitationTable
            campagneId={id}
            invitedIds={invitedIds}
            onInvited={(ids) => {
              setInvitedIds((prev) => new Set([...prev, ...ids]));
              setSuccess(ids.length > 1 ? `✅ ${ids.length} invitation(s) envoyée(s) !` : '✅ Invitation envoyée avec succès !');
            }}
            onError={(message) => setError(message)}
          />
        </div>

        <div className="mt-2">
          <Link href={`/campagnes/${id}`} className="text-sm text-gray-400 hover:text-emerald-600">
            ← Retour à la campagne
          </Link>
        </div>
      </div>
    </DashboardEntreprise>
  );
}
