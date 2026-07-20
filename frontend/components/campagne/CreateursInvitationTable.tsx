'use client';

import { useEffect, useState } from 'react';
import { collabApi, createurApi } from '@/lib/api';

type SortKey = 'nom' | 'audience' | 'tarifMoyen' | 'noteMoyenne';

interface Props {
  campagneId: string;
  invitedIds: Set<string>;
  onInvited: (createurIds: string[]) => void;
  onError: (message: string) => void;
}

export default function CreateursInvitationTable({ campagneId, invitedIds, onInvited, onError }: Props) {
  const [createurs, setCreateurs]       = useState<any[]>([]);
  const [search, setSearch]             = useState('');
  const [sortKey, setSortKey]           = useState<SortKey>('audience');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [inviting, setInviting]         = useState<string | null>(null);
  const [invitingBulk, setInvitingBulk] = useState(false);

  useEffect(() => {
    createurApi.lister().then((data: any) => setCreateurs(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const toggleSelection = (createurId: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(createurId)) s.delete(createurId); else s.add(createurId);
      return s;
    });
  };

  const handleInviter = async (createurId: string) => {
    setInviting(createurId);
    try {
      await collabApi.inviter({ campagneId, createurId });
      onInvited([createurId]);
    } catch (e: any) {
      onError(e.message || 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setInviting(null);
    }
  };

  const handleInviterSelection = async () => {
    if (selectedIds.size === 0) return;
    setInvitingBulk(true);
    const ids = Array.from(selectedIds).filter((cid) => !invitedIds.has(cid));
    const resultats = await Promise.allSettled(ids.map((cid) => collabApi.inviter({ campagneId, createurId: cid })));
    const reussies = ids.filter((_, i) => resultats[i].status === 'fulfilled');
    if (reussies.length > 0) {
      onInvited(reussies);
      setSelectedIds(new Set());
    }
    const echecs = resultats.filter((r) => r.status === 'rejected').length;
    if (echecs > 0) onError(`${echecs} invitation(s) ont échoué (déjà invité(e)s ?).`);
    setInvitingBulk(false);
  };

  const filtered = createurs
    .filter((c) =>
      c.nom?.toLowerCase().includes(search.toLowerCase()) ||
      c.handle?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const va = a[sortKey] ?? -1;
      const vb = b[sortKey] ?? -1;
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-gray-900">Tous les créateurs</h2>
        {selectedIds.size > 0 && (
          <button onClick={handleInviterSelection} disabled={invitingBulk}
            className="text-sm px-4 py-2 bg-gradient-brand text-white rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-bento hover-lift">
            {invitingBulk ? 'Envoi…' : `Inviter la sélection (${selectedIds.size})`}
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">Recherchez, comparez et sélectionnez plusieurs créateurs à inviter en une fois — sans passer uniquement par les recommandations.</p>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un créateur par nom ou handle…"
        className="w-full mb-4 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
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
              <tr key={c.id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.has(c.id) ? 'bg-brand-50/50' : ''}`}>
                <td className="px-3 py-3">
                  <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelection(c.id)}
                    disabled={invitedIds.has(c.id)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-sm font-bold text-brand-700 flex-shrink-0">
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
                      <span key={n.niche} className="text-[10px] px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full">{n.niche}</span>
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
                    className="text-xs px-3 py-1.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-400 disabled:opacity-50 transition-colors">
                    {inviting === c.id ? '…' : invitedIds.has(c.id) ? '✓ Invité' : 'Inviter'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
