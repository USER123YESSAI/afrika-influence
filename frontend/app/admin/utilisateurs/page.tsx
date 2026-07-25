'use client';
import { useEffect, useState } from 'react';
import DashboardAdmin from '@/components/layout/DashboardAdmin';
import { adminApi, moderateurApi, ROLE_LABELS, STATUT_USER_LABELS } from '@/lib/api';

const TABS = [
  { key: 'CREATEUR',   label: 'Créateurs',   icon: '🎨' },
  { key: 'ENTREPRISE', label: 'Entreprises', icon: '🏢' },
  { key: 'PARTICULIER',label: 'Particuliers',icon: '👤' },
];

export default function AdminUtilisateursPage() {
  const [tab, setTab]           = useState('CREATEUR');
  const [users, setUsers]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [historique, setHist]   = useState<any[]>([]);
  const [loadingHist, setLH]    = useState(false);
  const [toast, setToast]       = useState('');
  const [raison, setRaison]     = useState('');
  const [processing, setProc]   = useState(false);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const load = (role = tab) => {
    setLoading(true);
    adminApi.getUtilisateurs({ role })
      .then((d: any) => setUsers(d.utilisateurs || d || []))
      .catch((e: any) => showToast('❌ ' + e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const openProfile = (u: any) => {
    setSelected(u);
    setRaison('');
    setLH(true);
    adminApi.getLogs({ acteurId: u.id })
      .then((d: any) => setHist(d.logs || d || []))
      .catch(() => setHist([]))
      .finally(() => setLH(false));
  };

  const handleAvertir = async (u: any) => {
    if (!raison.trim()) return showToast('❌ Motif requis pour un avertissement');
    setProc(true);
    try {
      await moderateurApi.appliquerSanction(u.id, { action: 'AVERTIR', raison });
      showToast('⚠️ Avertissement envoyé');
      setRaison('');
      openProfile(u); // reload history
    } catch (e: any) { showToast('❌ ' + e.message); }
    finally { setProc(false); }
  };

  const handleSuspend = async (u: any) => {
    try {
      await adminApi.changerStatut(u.id, u.statut === 'suspended' ? 'validated' : 'suspended');
      showToast(u.statut === 'suspended' ? '✅ Compte réactivé' : '⏸️ Compte suspendu');
      load(); setSelected(null);
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const handleBan = async (u: any) => {
    if (!confirm(`Bannir définitivement le compte de ${u.nom} ? Cette action est irréversible.`)) return;
    try {
      await adminApi.changerStatut(u.id, 'banned');
      showToast('🚫 Compte banni définitivement');
      load(); setSelected(null);
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <DashboardAdmin title="Utilisateurs" subtitle="Gérer les comptes de la plateforme">
      {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50 animate-fade-in">{toast}</div>}

      {/* Profile modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-soft p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-xl font-bold text-brand-700">
                  {selected.nom?.[0]}
                </div>
                <div>
                  <h2 className="font-display text-xl text-gray-900">{selected.nom}</h2>
                  <p className="text-sm text-gray-400">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Rôle</p>
                <p className="font-medium text-gray-900">{ROLE_LABELS[selected.role] ?? selected.role}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Statut</p>
                <span className={`badge ${STATUT_USER_LABELS[selected.statut]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUT_USER_LABELS[selected.statut]?.label ?? selected.statut}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                <p className="text-xs text-gray-400 mb-1">Inscrit le</p>
                <p className="font-medium text-gray-900">{fmtDate(selected.createdAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Historique d'activité</p>
              {loadingHist ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
              ) : historique.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Aucune activité enregistrée.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                  {historique.map((h: any) => (
                    <div key={h.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-xs">
                      <span className="text-gray-700">{h.typeAction?.replace(/_/g, ' ')}</span>
                      <span className="text-gray-400">{fmtDate(h.dateAction)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Motif d'intervention (Optionnel sauf Avertissement)</label>
                <textarea value={raison} onChange={e => setRaison(e.target.value)} rows={2}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                  placeholder="Justifiez la sanction..." />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAvertir(selected)} disabled={processing}
                  className="flex-1 py-2 border border-amber-400 text-amber-700 bg-amber-50 text-xs font-semibold rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50">
                  ⚠️ Avertir
                </button>
                <button onClick={() => handleSuspend(selected)} disabled={processing}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 bg-gray-50 text-xs font-semibold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50">
                  {selected.statut === 'suspended' ? '✅ Réactiver' : '⏸️ Suspendre'}
                </button>
                <button onClick={() => handleBan(selected)} disabled={processing}
                  className="flex-1 py-2 border border-red-500 text-red-600 bg-red-50 text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50">
                  🚫 Bannir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl shadow-card w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? 'bg-gradient-brand text-white shadow-bento' : 'text-gray-500 hover:bg-gray-50'
            }`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="p-2 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>Aucun utilisateur dans cette catégorie.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 -mx-6 -my-6">
            {users.map((u: any) => {
              const s = STATUT_USER_LABELS[u.statut];
              return (
                <button key={u.id} onClick={() => openProfile(u)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center font-bold text-brand-700 text-sm flex-shrink-0">
                    {u.nom?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{u.nom}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  {s && <span className={`badge ${s.color} flex-shrink-0`}>{s.label}</span>}
                  <span className="text-xs text-gray-300 flex-shrink-0">{fmtDate(u.createdAt)}</span>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DashboardAdmin>
  );
}
