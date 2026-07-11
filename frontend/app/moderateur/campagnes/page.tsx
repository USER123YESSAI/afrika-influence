'use client';
import { useEffect, useState } from 'react';
import DashboardModerateur from '@/components/layout/DashboardModerateur';
import { moderateurApi, formatFCFA } from '@/lib/api';

const STATUT_COLOR: Record<string, string> = {
  PUBLIEE:  'bg-emerald-100 text-emerald-700',
  EN_COURS: 'bg-blue-100 text-blue-700',
  ANNULEE:  'bg-red-100 text-red-700',
};

export default function ModCampagnes() {
  const [campagnes, setCampagnes] = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [filterStatut, setFilter] = useState('');
  const [modal, setModal]         = useState<any | null>(null);
  const [raison, setRaison]       = useState('');
  const [processing, setProc]     = useState(false);
  const [toast, setToast]         = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async (statut = filterStatut) => {
    setLoading(true);
    try {
      const d: any = await moderateurApi.getCampagnes(statut ? { statut } : undefined);
      setCampagnes(d.campagnes || []);
      setTotal(d.total || 0);
    } catch (e: any) { showToast('Erreur : ' + e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatut]);

  const handleAction = async (action: string) => {
    if (!modal) return;
    setProc(true);
    try {
      await moderateurApi.modererCampagne(modal.id, { action, raison });
      showToast(action === 'APPROUVER' ? '✅ Campagne approuvée' : action === 'SUSPENDRE' ? '⏸️ Suspendue' : '❌ Rejetée');
      setModal(null); setRaison(''); load();
    } catch (e: any) { showToast('Erreur : ' + e.message); }
    finally { setProc(false); }
  };

  return (
    <DashboardModerateur>
      {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50 animate-fade-in">{toast}</div>}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-bento p-6 w-full max-w-lg space-y-4">
            <h2 className="font-display text-xl font-bold text-gray-900">Modérer la campagne</h2>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-1 text-sm">
              <p className="font-medium text-gray-900">{modal.titre}</p>
              <p className="text-gray-500">{modal.entreprise?.nom} · {formatFCFA(modal.budget)}</p>
              {modal.description && <p className="text-xs text-gray-400 mt-1">{modal.description}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Raison / commentaire</label>
              <textarea value={raison} onChange={e => setRaison(e.target.value)} rows={2}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                placeholder="Justifiez votre décision…" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAction('APPROUVER')} disabled={processing}
                className="flex-1 py-2.5 bg-gradient-emerald text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all hover-lift">
                ✅ Approuver
              </button>
              <button onClick={() => handleAction('SUSPENDRE')} disabled={processing}
                className="flex-1 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all hover-lift">
                ⏸️ Suspendre
              </button>
              <button onClick={() => handleAction('REJETER')} disabled={processing}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all hover-lift">
                ❌ Rejeter
              </button>
              <button onClick={() => { setModal(null); setRaison(''); }}
                className="px-3 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-emerald-600">Campagnes</h1>
          <p className="text-gray-600 mt-1">{total} campagne{total > 1 ? 's' : ''} à contrôler</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Campagnes publiées et en cours</h2>
            <select value={filterStatut} onChange={e => setFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="">Publiées + En cours</option>
              <option value="PUBLIEE">Publiées</option>
              <option value="EN_COURS">En cours</option>
              <option value="ANNULEE">Annulées</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : campagnes.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><div className="text-3xl mb-2">📢</div><p>Aucune campagne à contrôler</p></div>
          ) : (
            <div className="space-y-3">
              {campagnes.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">{c.titre}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUT_COLOR[c.statut] ?? 'bg-gray-100 text-gray-600'}`}>{c.statut}</span>
                    </div>
                    <p className="text-xs text-gray-400">{c.entreprise?.nom} · {formatFCFA(c.budget)}</p>
                  </div>
                  <button onClick={() => setModal(c)}
                    className="ml-3 text-xs px-3 py-1.5 bg-gradient-emerald text-white rounded-xl hover:opacity-90 font-medium hover-lift transition-all flex-shrink-0">
                    Modérer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardModerateur>
  );
}
