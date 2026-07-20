'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import { getCampagne, getRecommandations, collabApi, createurApi, type Campagne, type Recommandation } from '@/lib/api';
import CreateurRecommande from '@/components/recommandation/CreateurRecommande';

type SortKey = 'nom' | 'audience' | 'tarifMoyen' | 'noteMoyenne';

export default function InviterPage() {
  const { id } = useParams<{ id: string }>();
  const [campagne, setCampagne]           = useState<Campagne | null>(null);
  const [recommandations, setReco]        = useState<Recommandation[]>([]);
  const [loadingReco, setLoadingReco]     = useState(false);
  const [inviting, setInviting]           = useState<string | null>(null);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [invitedIds, setInvitedIds]       = useState<Set<string>>(new Set());

  // Tableau des créateurs — recherche, tri, sélection multiple
  const [createurs, setCreateurs]         = useState<any[]>([]);
  const [search, setSearch]               = useState('');
  const [sortKey, setSortKey]             = useState<SortKey>('audience');
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [invitingBulk, setInvitingBulk]   = useState(false);

  useEffect(() => {
    if (!id) return;
    getCampagne(id).then(setCampagne).catch((e: any) => setError(e.message));
    createurApi.lister().then((data: any) => setCreateurs(Array.isArray(data) ? data : [])).catch(() => {});
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

  const toggleSelection = (createurId: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(createurId)) s.delete(createurId); else s.add(createurId);
      return s;
    });
  };

  const handleInviterSelection = async () => {
    if (!id || selectedIds.size === 0) return;
    setInvitingBulk(true); setError(''); setSuccess('');
    const ids = Array.from(selectedIds).filter(cid => !invitedIds.has(cid));
    const resultats = await Promise.allSettled(ids.map(cid => collabApi.inviter({ campagneId: id, createurId: cid })));
    const reussies = ids.filter((_, i) => resultats[i].status === 'fulfilled');
    if (reussies.length > 0) {
      setInvitedIds(prev => new Set([...prev, ...reussies]));
      setSelectedIds(new Set());
    }
    const echecs = resultats.filter(r => r.status === 'rejected').length;
    if (echecs > 0) setError(`${echecs} invitation(s) ont échoué (déjà invité(e)s ?).`);
    if (reussies.length > 0) setSuccess(`✅ ${reussies.length} invitation(s) envoyée(s) !`);
    setInvitingBulk(false);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = createurs
    .filter(c =>
      c.nom?.toLowerCase().includes(search.toLowerCase()) ||
      c.handle?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const va = a[sortKey] ?? -1;
      const vb = b[sortKey] ?? -1;
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });

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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6 mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900">Tous les créateurs</h2>
            {selectedIds.size > 0 && (
              <button onClick={handleInviterSelection} disabled={invitingBulk}
                className="text-sm px-4 py-2 bg-gradient-emerald text-white rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-bento hover-lift">
                {invitingBulk ? 'Envoi…' : `Inviter la sélection (${selectedIds.size})`}
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">Recherchez, comparez et sélectionnez plusieurs créateurs à inviter en une fois.</p>

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un créateur par nom ou handle…"
            className="w-full mb-4 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-500 font-medium">
                <tr>
                  <th className="px-3 py-3 w-10"></th>
                  <th className="px-3 py-3 font-medium cursor-pointer hover:text-gray-800" onClick={() => toggleSort('nom')}>
                    Créateur {sortKey === 'nom' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-3 py-3 font-medium cursor-pointer hover:text-gray-800" onClick={() => toggleSort('audience')}>
                    Audience {sortKey === 'audience' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-3 py-3 font-medium">Niches</th>
                  <th className="px-3 py-3 font-medium">Réseaux</th>
                  <th className="px-3 py-3 font-medium cursor-pointer hover:text-gray-800" onClick={() => toggleSort('tarifMoyen')}>
                    Tarif moyen {sortKey === 'tarifMoyen' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-3 py-3 font-medium cursor-pointer hover:text-gray-800" onClick={() => toggleSort('noteMoyenne')}>
                    Note {sortKey === 'noteMoyenne' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-3 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-10 text-center text-gray-400">Aucun créateur trouvé.</td></tr>
                ) : filtered.map((c: any) => (
                  <tr key={c.id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.has(c.id) ? 'bg-emerald-50/50' : ''}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelection(c.id)}
                        disabled={invitedIds.has(c.id)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 flex-shrink-0">
                          {c.nom?.[0] ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{c.nom}</p>
                          <p className="text-xs text-gray-400 truncate">{c.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{c.audience?.toLocaleString('fr-FR') ?? '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(c.niches || []).slice(0, 2).map((n: any) => (
                          <span key={n.niche} className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">{n.niche}</span>
                        ))}
                        {(c.niches?.length || 0) === 0 && <span className="text-gray-300">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-500">{Object.keys(c.reseaux || {}).join(', ') || '—'}</td>
                    <td className="px-3 py-3 text-gray-700">{c.tarifMoyen ? `${c.tarifMoyen.toLocaleString('fr-FR')} FCFA` : '—'}</td>
                    <td className="px-3 py-3 text-gray-700">{c.noteMoyenne ? `★ ${c.noteMoyenne}` : '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => handleInviter(c.id)}
                        disabled={inviting === c.id || invitedIds.has(c.id)}
                        className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-400 disabled:opacity-50 transition-colors">
                        {inviting === c.id ? '…' : invitedIds.has(c.id) ? '✓ Invité' : 'Inviter'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
