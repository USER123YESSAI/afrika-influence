'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import { getMesCampagnes, publierCampagne, annulerCampagne, terminerCampagne, type Campagne, type StatutCampagne } from '@/lib/api';
import CampagneStatut from '@/components/campagne/CampagneStatut';
import { showToast } from '@/components/ui/Toast';

const STATUTS: { value: string; label: string }[] = [
  { value: '', label: 'Toutes' },
  { value: 'BROUILLON', label: 'Brouillon' },
  { value: 'PUBLIEE', label: 'Publiée' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'EN_ATTENTE_VALIDATION', label: 'En attente' },
  { value: 'TERMINEE', label: 'Terminée' },
  { value: 'ANNULEE', label: 'Annulée' },
];

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' CFA';
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function CampagnesPage() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const searchParams = useSearchParams();
  const [filtre, setFiltre] = useState(searchParams.get('statut') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (statut?: string) => {
    setLoading(true);
    getMesCampagnes(statut || undefined)
      .then(setCampagnes)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(searchParams.get('statut') || ''); }, []);

  const handleFiltre = (val: string) => {
    setFiltre(val);
    load(val);
  };

  const action = async (fn: (id: string) => Promise<unknown>, id: string) => {
    try { 
      await fn(id); 
      load(filtre); 
      showToast('Action effectuée avec succès', 'success');
    } catch (e) { 
      showToast((e as Error).message, 'error'); 
    }
  };

  return (
    <DashboardEntreprise>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-emerald-600">Mes campagnes</h1>
          <Link href="/campagnes/nouvelle"
            className="bg-gradient-emerald text-white px-4 py-2 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-bento hover-lift">
            + Nouvelle
          </Link>
        </div>

        {/* Filtres statut */}
        <div className="flex gap-2 flex-wrap mb-6">
          {STATUTS.map(s => (
            <button key={s.value} onClick={() => handleFiltre(s.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all hover-lift ${
                filtre === s.value
                  ? 'bg-gradient-emerald text-white shadow-bento'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-400'
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        {error && <p className="text-red-700 bg-red-50 px-4 py-3 rounded-2xl text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">Chargement…</div>
        ) : campagnes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-card border border-gray-100">
            <p className="text-gray-400 mb-4">Aucune campagne trouvée</p>
            <Link href="/campagnes/nouvelle" className="text-emerald-600 hover:underline text-sm font-medium">
              Créer ma première campagne →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4 font-medium">Campagne</th>
                    <th className="px-6 py-4 font-medium">Statut</th>
                    <th className="px-6 py-4 font-medium">Budget</th>
                    <th className="px-6 py-4 font-medium">Dates</th>
                    <th className="px-6 py-4 font-medium">Créateurs</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campagnes.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/campagnes/${c.id}`} className="font-medium text-gray-900 hover:text-emerald-600">
                          {c.titre}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <CampagneStatut statut={c.statut} />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {fmt(c.budget ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {fmtDate(c.dateDebut)} - {fmtDate(c.dateFin)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {c.nombreCreateursVoulus ?? '—'}
                      </td>
                      <td className="px-6 py-4 flex items-center justify-end gap-2">
                        <Link href={`/campagnes/${c.id}`} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors">
                          Voir
                        </Link>
                        {['BROUILLON', 'PUBLIEE'].includes(c.statut) && (
                          <Link href={`/campagnes/${c.id}/modifier`} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors">
                            Modifier
                          </Link>
                        )}
                        {c.statut === 'BROUILLON' && (
                          <button onClick={() => action(publierCampagne, c.id)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium transition-colors">
                            Publier
                          </button>
                        )}
                        {c.statut === 'PUBLIEE' && (
                          <Link href={`/campagnes/${c.id}/inviter`} className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium transition-colors">
                            Inviter
                          </Link>
                        )}
                        {['PUBLIEE', 'EN_COURS'].includes(c.statut) && (
                          <button onClick={() => action(terminerCampagne, c.id)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium transition-colors">
                            Terminer
                          </button>
                        )}
                        {!['ANNULEE', 'TERMINEE'].includes(c.statut) && (
                          <button onClick={() => action(annulerCampagne, c.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-medium transition-colors">
                            Annuler
                          </button>
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
    </DashboardEntreprise>
  );
}
