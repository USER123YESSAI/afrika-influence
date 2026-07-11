'use client';
import { useEffect, useState } from 'react';
import DashboardModerateur from '@/components/layout/DashboardModerateur';
import { moderateurApi, ROLE_LABELS } from '@/lib/api';
import Link from 'next/link';

export default function ModProfils() {
  const [users, setUsers]     = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterRole, setRole] = useState('');
  const [processing, setProc] = useState<string | null>(null);
  const [modal, setModal]     = useState<any | null>(null);
  const [raison, setRaison]   = useState('');
  const [toast, setToast]     = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async (role = filterRole) => {
    setLoading(true);
    try {
      const d: any = await moderateurApi.getProfilsEnAttente(role ? { role } : undefined);
      setUsers(d.utilisateurs || []);
      setTotal(d.total || 0);
    } catch (e: any) { showToast('Erreur : ' + e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterRole]);

  const handleAction = async (statut: string) => {
    if (!modal) return;
    setProc(modal.id);
    try {
      await moderateurApi.validerProfil(modal.id, { statut, raison });
      showToast(statut === 'validated' ? '✅ Profil validé' : statut === 'rejected' ? '❌ Profil rejeté' : '⏸️ Compte suspendu');
      setModal(null); setRaison('');
      load();
    } catch (e: any) { showToast('Erreur : ' + e.message); }
    finally { setProc(null); }
  };

  return (
    <DashboardModerateur>
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50 animate-fade-in">{toast}</div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-bento p-6 w-full max-w-md space-y-4">
            <h2 className="font-display text-xl font-bold text-gray-900">Traiter le profil</h2>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-1 text-sm">
              <p className="font-medium text-gray-900">{modal.nom}</p>
              <p className="text-gray-500">{modal.email}</p>
              <p className="text-xs text-gray-400">{ROLE_LABELS[modal.role] ?? modal.role}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Raison (optionnelle)</label>
              <textarea value={raison} onChange={e => setRaison(e.target.value)} rows={2}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                placeholder="Justifiez votre décision…" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAction('validated')} disabled={!!processing}
                className="flex-1 py-2.5 bg-gradient-emerald text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all hover-lift">
                ✅ Valider
              </button>
              <button onClick={() => handleAction('rejected')} disabled={!!processing}
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
          <h1 className="font-display text-3xl font-bold text-emerald-600">Profils en attente</h1>
          <p className="text-gray-600 mt-1">{total} compte{total > 1 ? 's' : ''} à valider</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Comptes en attente de validation</h2>
            <select value={filterRole} onChange={e => setRole(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="">Tous les rôles</option>
              <option value="CREATEUR">Créateurs</option>
              <option value="ENTREPRISE">Entreprises</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-3xl mb-2">✅</div>
              <p>Aucun profil en attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u: any) => (
                <div key={u.id}
                  className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{u.nom}</div>
                    <div className="text-xs text-gray-400">{u.email} · {ROLE_LABELS[u.role] ?? u.role}</div>
                  </div>
                  <button onClick={() => setModal(u)}
                    className="text-xs px-3 py-1.5 bg-gradient-emerald text-white rounded-xl hover:opacity-90 font-medium hover-lift transition-all">
                    Traiter
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
