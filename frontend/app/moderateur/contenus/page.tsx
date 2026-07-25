'use client';
import { useEffect, useState } from 'react';
import DashboardModerateur from '@/components/layout/DashboardModerateur';
import ContenuViewerModal from '@/components/ui/ContenuViewerModal';
import { moderateurApi } from '@/lib/api';

const STATUT_BADGE: Record<string, { label: string; className: string }> = {
  EN_ATTENTE: { label: 'En attente de la marque', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  VALIDEE:    { label: 'Validée · payée',         className: 'bg-brand-50 text-brand-700 border border-brand-200' },
  REFUSEE:    { label: 'Refusée',                 className: 'bg-red-50 text-red-700 border border-red-200' },
};

export default function ModContenus() {
  const [soumissions, setSoumissions] = useState<any[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('');
  const [toast, setToast]             = useState('');
  const [viewingUrl, setViewingUrl]   = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async (statut = filter) => {
    setLoading(true);
    try {
      const d: any = await moderateurApi.getContenus(statut ? { statut } : undefined);
      setSoumissions(d.soumissions || []);
      setTotal(d.total || 0);
    } catch (e: any) { showToast('Erreur : ' + e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <DashboardModerateur>
      {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50 animate-fade-in">{toast}</div>}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-brand-600">Contenus livrés</h1>
          <p className="text-gray-600 mt-1">
            {total} soumission{total > 1 ? 's' : ''} — validées directement par les entreprises,
            avec paiement automatique au créateur. Cette page est une vue de visibilité ; en cas de
            problème sur une campagne, intervenez depuis l'onglet Campagnes ou les Sanctions.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Soumissions des créateurs</h2>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">Toutes</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="VALIDEE">Validées</option>
              <option value="REFUSEE">Refusées</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : soumissions.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><div className="text-3xl mb-2">📋</div><p>Aucune soumission pour l'instant</p></div>
          ) : (
            <div className="space-y-3">
              {soumissions.map((s: any) => {
                const badge = STATUT_BADGE[s.statut];
                const collab = s.ligne?.Collaboration;
                return (
                  <div key={s.id} className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm truncate">{collab?.campagne?.titre ?? 'Campagne inconnue'}</p>
                          {badge && <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${badge.className}`}>{badge.label}</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {collab?.createur?.nom} {collab?.createur?.handle && `· ${collab.createur.handle}`}
                          {s.ligne?.offre && ` · ${s.ligne.offre.typeContenu} (${s.ligne.offre.reseau})`}
                        </p>
                        {s.contenuUrl && (
                          <button onClick={() => setViewingUrl(s.contenuUrl)}
                            className="text-xs text-brand-600 hover:underline truncate block mt-1 text-left">
                            {s.contenuUrl.startsWith('/uploads') ? '📎 Voir le fichier joint' : `🔗 ${s.contenuUrl}`}
                          </button>
                        )}
                        {s.statut === 'REFUSEE' && s.raisonRefus && (
                          <p className="text-xs text-red-500 mt-1">Motif du refus (par l'entreprise) : {s.raisonRefus}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(s.dateSoumission).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {viewingUrl && <ContenuViewerModal url={viewingUrl} onClose={() => setViewingUrl(null)} />}
    </DashboardModerateur>
  );
}
