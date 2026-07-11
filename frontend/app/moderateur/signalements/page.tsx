'use client';
import { useEffect, useState } from 'react';
import DashboardModerateur from '@/components/layout/DashboardModerateur';
import { moderateurApi } from '@/lib/api';

export default function SignalementsPage() {
  const [signalements, setSignalements] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('EN_ATTENTE');
  const [processing, setProc] = useState<string | null>(null);
  const [modal, setModal] = useState<any | null>(null);
  const [decisionAdmin, setDecision] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async (statut = filterStatut) => {
    setLoading(true);
    try {
      const d: any = await moderateurApi.getSignalements(statut ? { statut } : undefined);
      setSignalements(d.signalements || []);
      setTotal(d.total || 0);
    } catch (e: any) { showToast('Erreur : ' + e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatut]);

  const handleAction = async (statut: string) => {
    if (!modal) return;
    setProc(modal.id);
    try {
      await moderateurApi.traiterSignalement(modal.id, { statut, decisionAdmin });
      showToast(statut === 'RESOLU' ? '✅ Signalement résolu' : '❌ Signalement rejeté');
      setModal(null); setDecision('');
      load();
    } catch (e: any) { showToast('Erreur : ' + e.message); }
    finally { setProc(null); }
  };

  return (
    <DashboardModerateur title="Signalements" subtitle="Gérer les rapports des utilisateurs">
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50 animate-fade-in">{toast}</div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-bento p-6 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="font-display text-xl font-bold text-gray-900">Traiter le signalement</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-2 text-sm">
              <p><span className="font-semibold text-gray-700">Auteur :</span> {modal.auteur?.nom} ({modal.auteur?.email})</p>
              <p><span className="font-semibold text-gray-700">Entité ciblée :</span> {modal.entiteCible} (ID: {modal.cibleId})</p>
              <p><span className="font-semibold text-gray-700">Motif :</span> {modal.motif}</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-700">
              <p className="font-medium mb-1">Description :</p>
              <p className="whitespace-pre-wrap">{modal.description || 'Aucune description fournie.'}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Décision du modérateur</label>
              <textarea value={decisionAdmin} onChange={e => setDecision(e.target.value)} rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                placeholder="Ex: Avertissement envoyé, faux signalement, etc." />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAction('RESOLU')} disabled={!!processing}
                className="flex-1 py-2.5 bg-gradient-emerald text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all hover-lift">
                ✅ Marquer Résolu
              </button>
              <button onClick={() => handleAction('REJETE')} disabled={!!processing}
                className="flex-1 py-2.5 bg-gray-200 text-gray-800 text-sm font-semibold rounded-xl hover:bg-gray-300 disabled:opacity-50 transition-all hover-lift">
                ❌ Rejeter (Invalide)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Liste des signalements</h2>
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="RESOLU">Résolus</option>
              <option value="REJETE">Rejetés</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : signalements.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-3">🛡️</div>
              <p>Aucun signalement trouvé.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signalements.map((s: any) => (
                <div key={s.id}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-white transition-colors shadow-sm">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">Cible : {s.entiteCible}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{s.motif}</span>
                      {s.statut === 'EN_ATTENTE' && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">En attente</span>}
                      {s.statut === 'RESOLU' && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Résolu</span>}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-1 break-all">
                      Auteur: {s.auteur?.nom} | ID Cible: {s.cibleId}
                    </div>
                  </div>
                  <button onClick={() => setModal(s)}
                    className="text-xs px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium hover-lift transition-all flex-shrink-0 ml-4">
                    {s.statut === 'EN_ATTENTE' ? 'Traiter' : 'Voir'}
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
