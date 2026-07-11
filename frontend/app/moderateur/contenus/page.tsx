'use client';
import { useEffect, useState } from 'react';
import DashboardModerateur from '@/components/layout/DashboardModerateur';
import { moderateurApi, STATUT_LABELS } from '@/lib/api';

export default function ModContenus() {
  const [contenus, setContenus] = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('CONTENU_SOUMIS');
  const [modal, setModal]       = useState<any | null>(null);
  const [raison, setRaison]     = useState('');
  const [processing, setProc]   = useState(false);
  const [toast, setToast]       = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async (statut = filter) => {
    setLoading(true);
    try {
      const d: any = await moderateurApi.getContenus(statut ? { statut } : undefined);
      setContenus(d.contenus || []);
      setTotal(d.total || 0);
    } catch (e: any) { showToast('Erreur : ' + e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleAction = async (action: 'APPROUVER' | 'REJETER') => {
    if (!modal) return;
    setProc(true);
    try {
      await moderateurApi.modererContenu(modal.id, { action, raison });
      showToast(action === 'APPROUVER' ? '✅ Contenu approuvé' : '❌ Contenu rejeté');
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
            <h2 className="font-display text-xl font-bold text-gray-900">Vérifier le contenu</h2>
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 space-y-2 text-sm">
              <p className="font-medium text-gray-900">{modal.campagne?.titre ?? 'Campagne inconnue'}</p>
              <p className="text-gray-500">Créateur : {modal.createur?.nom} {modal.createur?.handle && `(${modal.createur.handle})`}</p>
              {modal.campagne?.consignesContenu && (
                <div className="pt-2 border-t border-purple-100">
                  <p className="text-xs font-medium text-gray-400 uppercase mb-1">Consignes de la campagne</p>
                  <p className="text-gray-600 text-xs">{modal.campagne.consignesContenu}</p>
                </div>
              )}
              {modal.contenuUrl && (
                <div className="pt-2 border-t border-purple-100">
                  <p className="text-xs font-medium text-gray-400 uppercase mb-1">Lien du contenu</p>
                  <a href={modal.contenuUrl} target="_blank" rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline text-xs break-all">{modal.contenuUrl}</a>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Raison (obligatoire pour le rejet)
              </label>
              <textarea value={raison} onChange={e => setRaison(e.target.value)} rows={2}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                placeholder="Expliquez votre décision…" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleAction('APPROUVER')} disabled={processing}
                className="flex-1 py-2.5 bg-gradient-emerald text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all hover-lift">
                ✅ Approuver
              </button>
              <button onClick={() => handleAction('REJETER')} disabled={processing || !raison.trim()}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all hover-lift">
                ❌ Rejeter
              </button>
              <button onClick={() => { setModal(null); setRaison(''); }}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-emerald-600">Contenus à vérifier</h1>
          <p className="text-gray-600 mt-1">{total} contenu{total > 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Contenus soumis par les créateurs</h2>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="CONTENU_SOUMIS">Soumis</option>
              <option value="CONTENU_VALIDE">Validés</option>
              <option value="TRAVAIL_EN_COURS">En cours</option>
              <option value="">Tous</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : contenus.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><div className="text-3xl mb-2">📋</div><p>Aucun contenu à vérifier</p></div>
          ) : (
            <div className="space-y-3">
              {contenus.map((c: any) => {
                const s = STATUT_LABELS[c.statut];
                return (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm truncate">{c.campagne?.titre ?? 'Campagne inconnue'}</p>
                        {s && <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${s.color}`}>{s.label}</span>}
                      </div>
                      <p className="text-xs text-gray-400">{c.createur?.nom} {c.createur?.handle && `· ${c.createur.handle}`}</p>
                      {c.contenuUrl && (
                        <a href={c.contenuUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:underline truncate block mt-0.5">
                          🔗 {c.contenuUrl}
                        </a>
                      )}
                    </div>
                    {c.statut === 'CONTENU_SOUMIS' && (
                      <button onClick={() => setModal(c)}
                        className="ml-3 text-xs px-3 py-1.5 bg-gradient-emerald text-white rounded-xl hover:opacity-90 font-medium hover-lift transition-all flex-shrink-0">
                        Vérifier
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardModerateur>
  );
}
