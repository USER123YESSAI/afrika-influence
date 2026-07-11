'use client';

import Link from 'next/link';
import type { Campagne } from '@/lib/api';
import { publierCampagne, annulerCampagne, terminerCampagne } from '@/lib/api';
import CampagneStatut from './CampagneStatut';
import { showToast } from '@/components/ui/Toast';

interface Props {
  campagne: Campagne;
  onRefresh: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' XOF';

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function CampagneCard({ campagne, onRefresh }: Props) {
  const action = async (fn: (id: string) => Promise<unknown>) => {
    try { await fn(campagne.id); onRefresh(); }
    catch (e) { showToast((e as Error).message, 'error'); }
  };

  return (
    <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/campagnes/${campagne.id}`} className="font-semibold text-gray-900 hover:text-emerald-600 line-clamp-2">
          {campagne.titre}
        </Link>
        <CampagneStatut statut={campagne.statut} />
      </div>

      <div className="text-sm text-gray-500 grid grid-cols-2 gap-1">
        <span>Budget</span>         <span className="font-medium text-gray-800">{fmt(campagne.budget)}</span>
        <span>Créateurs voulus</span><span className="font-medium text-gray-800">{campagne.nombreCreateursVoulus ?? '—'}</span>
        <span>Début</span>          <span className="font-medium text-gray-800">{fmtDate(campagne.dateDebut)}</span>
        <span>Fin</span>            <span className="font-medium text-gray-800">{fmtDate(campagne.dateFin)}</span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1 border-t">
        <Link href={`/campagnes/${campagne.id}`}
          className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">
          Voir
        </Link>
        {['BROUILLON', 'PUBLIEE'].includes(campagne.statut) && (
          <Link href={`/campagnes/${campagne.id}/modifier`}
            className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">
            Modifier
          </Link>
        )}
        {campagne.statut === 'BROUILLON' && (
          <button onClick={() => action(publierCampagne)}
            className="text-xs px-3 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700">
            Publier
          </button>
        )}
        {campagne.statut === 'PUBLIEE' && (
          <Link href={`/campagnes/${campagne.id}/inviter`}
            className="text-xs px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700">
            Inviter
          </Link>
        )}
        {['PUBLIEE', 'EN_COURS'].includes(campagne.statut) && (
          <button onClick={() => action(terminerCampagne)}
            className="text-xs px-3 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700">
            Terminer
          </button>
        )}
        {!['ANNULEE', 'TERMINEE'].includes(campagne.statut) && (
          <button onClick={() => action(annulerCampagne)}
            className="text-xs px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700">
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
