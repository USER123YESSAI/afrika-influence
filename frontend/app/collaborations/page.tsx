'use client';
// frontend/app/collaborations/page.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardCreateur from '@/components/layout/DashboardCreateur';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import { getUser, collabApi, getImageUrl, STATUT_LABELS } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { showToast } from '@/components/ui/Toast';
import AuthGuard from '@/components/auth/AuthGuard';

interface Collab {
  id: string;
  statut: string;
  campagne: { titre: string; objectifPrincipal: string; budget: number };
  createur: { nom: string; handle: string; photoProfilUrl: string };
  dateInvitation: string;
  dateAcceptation?: string;
}

const FILTRES = [
  { value: '', label: 'Toutes' },
  { value: 'INVITATION_ENVOYEE', label: 'Invitations' },
  { value: 'CANDIDATURE_ENVOYEE', label: 'Candidatures' },
  { value: 'TRAVAIL_EN_COURS', label: 'En cours' },
  { value: 'TERMINEE', label: 'Terminées' },
];

export default function CollaborationsPage() {
  const [collabs, setCollabs] = useState<Collab[]>([]);
  const [filtre, setFiltre] = useState('');
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const loadCollabs = (statut = '') => {
    setLoading(true);
    collabApi.lister(statut || undefined)
      .then((d: any) => setCollabs(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCollabs(); }, []);

  const handleFiltre = (val: string) => {
    setFiltre(val);
    loadCollabs(val);
  };

  const handleAccepter = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await collabApi.accepter(id);
      showToast('✅ Collaboration acceptée !', 'success');
      loadCollabs(filtre);
    } catch (err: any) { showToast('❌ ' + err.message, 'error'); }
  };

  const handleRefuser = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Refuser cette collaboration ?')) return;
    try {
      await collabApi.refuser(id);
      showToast('Collaboration refusée.', 'info');
      loadCollabs(filtre);
    } catch (err: any) { showToast('❌ ' + err.message, 'error'); }
  };

  const userRole = typeof window !== 'undefined' ? (getUser()?.role ?? '') : '';
  const Shell = (userRole === 'ENTREPRISE' || userRole === 'PARTICULIER') ? DashboardEntreprise : DashboardCreateur;

  const filtresAffiches = FILTRES.map(f => {
    if (f.value === 'INVITATION_ENVOYEE' && userRole === 'CREATEUR') return { ...f, label: 'Invitations reçues' };
    if (f.value === 'INVITATION_ENVOYEE' && (userRole === 'ENTREPRISE' || userRole === 'PARTICULIER')) return { ...f, label: 'Invitations envoyées' };
    if (f.value === 'CANDIDATURE_ENVOYEE' && userRole === 'CREATEUR') return { ...f, label: 'Mes candidatures' };
    if (f.value === 'CANDIDATURE_ENVOYEE' && (userRole === 'ENTREPRISE' || userRole === 'PARTICULIER')) return { ...f, label: 'Candidatures reçues' };
    return f;
  });

  return (
    <AuthGuard roles={['CREATEUR', 'ENTREPRISE', 'PARTICULIER']}>
      <Shell>
        <div className="max-w-4xl mx-auto">
          

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-brand-600">
            Collaborations
          </h1>
          <p className="text-gray-600 mt-1">{collabs.length} collaboration{collabs.length !== 1 ? 's' : ''} au total</p>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap mb-6">
          {filtresAffiches.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFiltre(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover-lift ${
                filtre === f.value
                  ? 'bg-brand-600 text-white shadow-bento'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-white rounded-3xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : collabs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-16 text-center">
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune collaboration</h3>
            <p className="text-gray-400 text-sm">
              {filtre ? 'Aucune collaboration avec ce statut.' : 'Vos invitations apparaîtront ici.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4 font-medium">Campagne</th>
                    {userRole !== 'CREATEUR' && <th className="px-6 py-4 font-medium">Créateur</th>}
                    <th className="px-6 py-4 font-medium">Statut</th>
                    <th className="px-6 py-4 font-medium">Invité le</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {collabs.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/collaborations/${c.id}`} className="font-medium text-gray-900 hover:text-brand-600 block">
                          {c.campagne?.titre || 'Campagne sans nom'}
                        </Link>
                      </td>
                      {userRole !== 'CREATEUR' && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {c.createur?.photoProfilUrl && !imgError[c.id] ? (
                              <img 
                                src={getImageUrl(c.createur.photoProfilUrl)}
                                alt="" 
                                className="w-6 h-6 rounded-full object-cover" 
                                onError={() => setImgError(prev => ({ ...prev, [c.id]: true }))}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">
                                {c.createur?.nom?.[0] || '?'}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{c.createur?.nom || 'Inconnu'}</div>
                              <div className="text-xs text-gray-400">{c.createur?.handle || ''}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <StatusBadge statut={c.statut} />
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(c.dateInvitation).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 flex items-center justify-end gap-2">
                        {(
                          (c.statut === 'INVITATION_ENVOYEE' && userRole === 'CREATEUR') ||
                          (c.statut === 'CANDIDATURE_ENVOYEE' && (userRole === 'ENTREPRISE' || userRole === 'PARTICULIER'))
                        ) ? (
                          <>
                            <button
                              onClick={(e) => handleRefuser(c.id, e)}
                              className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-xl hover:bg-red-50 transition-colors"
                            >
                              Refuser
                            </button>
                            <button
                              onClick={(e) => handleAccepter(c.id, e)}
                              className="px-3 py-1.5 bg-gradient-brand text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-colors"
                            >
                              Accepter
                            </button>
                          </>
                        ) : (
                          <Link href={`/collaborations/${c.id}`} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors">
                            Voir détails
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </Shell>
    </AuthGuard>
  );
}

