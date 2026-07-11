'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import { getCampagne, getRecommandations, collabApi, createurApi, type Campagne, type Recommandation } from '@/lib/api';
import CreateurRecommande from '@/components/recommandation/CreateurRecommande';

export default function InviterPage() {
  const { id } = useParams<{ id: string }>();
  const [campagne, setCampagne]           = useState<Campagne | null>(null);
  const [recommandations, setReco]        = useState<Recommandation[]>([]);
  const [loadingReco, setLoadingReco]     = useState(false);
  const [inviting, setInviting]           = useState<string | null>(null);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [invitedIds, setInvitedIds]       = useState<Set<string>>(new Set());

  // Manual invitation — searchable list
  const [createurs, setCreateurs]         = useState<any[]>([]);
  const [search, setSearch]               = useState('');
  const [selectedCreateur, setSelected]   = useState<any | null>(null);
  const [showDropdown, setShowDropdown]   = useState(false);
  const searchRef                         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    getCampagne(id).then(setCampagne).catch((e: any) => setError(e.message));
    // Load all creators for manual search
    createurApi.lister().then((data: any) => setCreateurs(Array.isArray(data) ? data : [])).catch(() => {});
  }, [id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
      setSelected(null); setSearch('');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'envoi de l\'invitation');
    } finally { setInviting(null); }
  };

  const filtered = createurs.filter(c =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.handle?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

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
      <div className="max-w-3xl mx-auto">
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

        {/* Invitation manuelle par nom */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-1">Invitation manuelle</h2>
          <p className="text-sm text-gray-500 mb-4">Recherchez un créateur par son nom ou handle et invitez-le directement.</p>

          <div className="flex gap-3">
            {/* Searchable dropdown */}
            <div ref={searchRef} className="relative flex-1">
              <input
                type="text"
                value={selectedCreateur ? `${selectedCreateur.nom} (${selectedCreateur.handle})` : search}
                onChange={e => { setSearch(e.target.value); setSelected(null); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Rechercher un créateur par nom ou handle…"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              {selectedCreateur && (
                <button onClick={() => { setSelected(null); setSearch(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg">×</button>
              )}

              {showDropdown && !selectedCreateur && search.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-bento overflow-hidden">
                  {filtered.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Aucun créateur trouvé</p>
                  ) : filtered.map((c: any) => (
                    <button key={c.id}
                      onClick={() => { setSelected(c); setSearch(''); setShowDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 flex-shrink-0">
                        {c.nom?.[0] ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.nom}</p>
                        <p className="text-xs text-gray-400 truncate">{c.handle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedCreateur && (
            <div className="mt-6 max-w-[280px]">
              <CreateurRecommande 
                recommandation={{
                  id: 'manual',
                  createurId: selectedCreateur.id,
                  scoreCompatibilite: 100,
                  raisonnement: 'Sélection manuelle du créateur',
                  estConsultee: true,
                  createur: selectedCreateur
                } as any}
                rank={1}
                actionButton={
                  <button 
                    onClick={() => handleInviter(selectedCreateur.id)}
                    disabled={inviting === selectedCreateur.id || invitedIds.has(selectedCreateur.id)}
                    className="w-full py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                  >
                    {inviting === selectedCreateur.id ? 'Envoi…' : invitedIds.has(selectedCreateur.id) ? '✓ Invité' : 'Inviter'}
                  </button>
                }
              />
            </div>
          )}
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
