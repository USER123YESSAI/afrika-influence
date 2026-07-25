'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import TopBar from '@/components/layout/TopBar';
import { getPaiements, getUser, type Paiement } from '@/lib/api';
import FactureButton from '@/components/paiement/FactureButton';

const STATUT_STYLE: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  CONFIRME:   'bg-green-100 text-green-700',
  ECHOUE:     'bg-red-100 text-red-700',
  REMBOURSE:  'bg-gray-100 text-gray-600',
};

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente', CONFIRME: 'Confirmé', ECHOUE: 'Échoué', REMBOURSE: 'Remboursé',
};

const fmt = (n?: number) =>
  n !== undefined ? new Intl.NumberFormat('fr-FR').format(Number(n)) + ' CFA' : '—';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const userRole = typeof window !== 'undefined' ? (getUser()?.role ?? '') : '';
  const hideInternalDetails = userRole === 'ENTREPRISE' || userRole === 'PARTICULIER';
  const profileHref = userRole === 'CREATEUR' ? '/createur/profil'
    : userRole === 'PARTICULIER' ? '/entreprise/dashboard'
    : '/entreprise/profil';

  useEffect(() => {
    getPaiements()
      .then(setPaiements)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const total = paiements.filter(p => p.statut === 'CONFIRME').reduce((s, p) => s + Number(p.montant), 0);

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>;

  return (
    <AuthGuard roles={['ENTREPRISE', 'PARTICULIER', 'CREATEUR']}>
      <TopBar profileHref={profileHref} />
      <div className="p-8">
        <h1 className="font-display text-2xl font-bold text-emerald-600 mb-6">Historique des paiements</h1>

        {error && <p className="mb-4 text-red-700 bg-red-50 px-4 py-3 rounded-2xl text-sm">{error}</p>}

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total paiements', value: paiements.length },
            { label: 'Confirmés', value: paiements.filter(p => p.statut === 'CONFIRME').length },
            { label: 'Volume confirmé', value: fmt(total) },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-3xl shadow-bento p-5 hover-lift transition-all">
              <p className="text-xs text-gray-500 mb-1">{k.label}</p>
              <p className="font-display text-2xl font-bold text-gray-900">{k.value}</p>
            </div>
          ))}
        </div>

        {paiements.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-bento">
            <p className="text-gray-400">Aucun paiement pour l'instant</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-bento overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  {['Date', 'Montant', ...(hideInternalDetails ? [] : ['Commission', 'Net créateur', 'Méthode']), 'Statut', 'Facture'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paiements.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors hover-lift">
                    <td className="px-4 py-3 text-gray-600">{fmtDate(p.datePaiement || p.dateConfirmation)}</td>

                    <td className="px-4 py-3 font-medium text-gray-900">{fmt(p.montant)}</td>
                    {!hideInternalDetails && (
                      <>
                        <td className="px-4 py-3 text-gray-500">{fmt(p.montantCommission)}</td>
                        <td className="px-4 py-3 text-gray-500">{fmt(p.montantCreateur)}</td>
                        <td className="px-4 py-3 text-gray-600">{p.methode}</td>
                      </>
                    )}
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_STYLE[p.statut] ?? ''}`}>
                        {STATUT_LABELS[p.statut] ?? p.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <FactureButton paiement={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
