'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import { getMesCampagnes, getMonProfilEntreprise, type Campagne, type StatutCampagne } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';

const STATUTS: StatutCampagne[] = ['BROUILLON', 'PUBLIEE', 'EN_COURS', 'EN_ATTENTE_VALIDATION', 'TERMINEE', 'ANNULEE'];

const STATUT_LABELS: Record<StatutCampagne, string> = {
  BROUILLON: 'Brouillon',
  PUBLIEE: 'Publiée',
  EN_COURS: 'En cours',
  EN_ATTENTE_VALIDATION: 'En attente',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' CFA';

export default function DashboardPage() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [solde, setSolde] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getMesCampagnes(), getMonProfilEntreprise()])
      .then(([c, e]) => { setCampagnes(c); setSolde(Number(e.solde ?? 0)); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const countByStatut = (s: StatutCampagne) => campagnes.filter((c) => c.statut === s).length;
  const budgetTotal = campagnes.reduce((sum, c) => sum + Number(c.budget), 0);
  const budgetDepense = campagnes.reduce((sum, c) => sum + Number(c.budgetDepense ?? 0), 0);

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>;

  return (
    <AuthGuard roles={['ENTREPRISE', 'PARTICULIER']}>
      <DashboardEntreprise>
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-semibold text-mist">Dashboard</h1>
            <Link
              href="/campagnes/nouvelle"
              className="btn-primary"
            >
              + Nouvelle campagne
            </Link>
          </div>

          {error && (
            <p className="mb-4 text-red-400 bg-red-400/10 px-4 py-3 rounded-2xl text-sm">{error}</p>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Solde disponible', value: solde !== null ? fmt(solde) : '—', color: 'text-emerald', href: '/entreprise/solde' },
              { label: 'Campagnes totales', value: campagnes.length, color: 'text-emerald' },
              { label: 'En cours', value: countByStatut('EN_COURS'), color: 'text-emerald' },
              { label: 'Budget total', value: fmt(budgetTotal), color: 'text-mist' },
              { label: 'Budget dépensé', value: fmt(budgetDepense), color: 'text-amber-400' },
            ].map((kpi) => {
              const content = (
                <>
                  <p className="text-xs text-fog mb-1">{kpi.label}</p>
                  <p className={`font-display text-2xl font-semibold ${kpi.color}`}>{kpi.value}</p>
                </>
              );
              const className = "rounded-2xl border border-hairline bg-surface p-5 hover-lift transition-all block";
              return kpi.href ? (
                <Link key={kpi.label} href={kpi.href} className={className}>{content}</Link>
              ) : (
                <div key={kpi.label} className={className}>{content}</div>
              );
            })}
          </div>

          {/* Par statut */}
          <div className="rounded-2xl border border-hairline bg-surface p-6 mb-8">
            <h2 className="font-semibold text-mist mb-4">Répartition par statut</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {STATUTS.map((s) => (
                <Link
                  key={s}
                  href={`/campagnes?statut=${s}`}
                  className="text-center p-3 rounded-2xl bg-surface-2 hover:bg-surface transition-colors hover-lift"
                >
                  <p className="font-display text-2xl font-semibold text-mist">{countByStatut(s)}</p>
                  <p className="text-xs text-fog mt-1">{STATUT_LABELS[s]}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Dernières campagnes */}
          <div className="rounded-2xl border border-hairline bg-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-mist">Dernières campagnes</h2>
              <Link href="/campagnes" className="text-sm text-cyan hover:underline font-medium">
                Voir toutes →
              </Link>
            </div>
            {campagnes.length === 0 ? (
              <p className="text-fog text-sm text-center py-8">Aucune campagne pour l'instant</p>
            ) : (
              <div className="divide-y divide-hairline">
                {campagnes.slice(0, 5).map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between">
                    <Link
                      href={`/campagnes/${c.id}`}
                      className="font-medium text-sm text-mist hover:text-cyan truncate max-w-xs"
                    >
                      {c.titre}
                    </Link>
                    <span className="text-xs text-fog ml-4 shrink-0">{fmt(c.budget ?? 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardEntreprise>
    </AuthGuard>
  );
}

