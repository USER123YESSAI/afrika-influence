'use client';

import { useEffect, useState } from 'react';
import DashboardCreateur from '@/components/layout/DashboardCreateur';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { collabApi, getPaiements, formatFCFA, type Paiement } from '@/lib/api';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';

interface Collab {
  id: string;
  statut: string;
  campagne: { titre: string; objectifPrincipal: string };
  totalRemuneration?: number;
  dateInvitation: string;
}

export default function DashboardPage() {
  const [collabs, setCollabs] = useState<Collab[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      collabApi.lister(),
      getPaiements().catch(() => []),
    ])
      .then(([c, p]: any) => {
        setCollabs(c);
        setPaiements(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    enCours: collabs.filter((c) => c.statut === 'TRAVAIL_EN_COURS').length,
    aValider: collabs.filter((c) => c.statut === 'CONTENU_SOUMIS').length,
    invitations: collabs.filter((c) => c.statut === 'INVITATION_ENVOYEE').length,
    gains: paiements
      .filter((p) => p.statut === 'CONFIRME')
      .reduce((s, p) => s + Number(p.montantCreateur || 0), 0),
  };

  return (
    <DashboardCreateur>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-mist">Tableau de bord</h1>
            <p className="text-fog mt-1">Vue d'ensemble de votre activité</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Collaborations en cours', value: stats.enCours },
<<<<<<< Updated upstream
              { label: 'Campagnes en cours', value: stats.enCours },
=======
>>>>>>> Stashed changes
              { label: 'Invitations reçues', value: stats.invitations },
              { label: 'Contenus en attente', value: stats.aValider },
              { label: 'Revenus perçus', value: formatFCFA(stats.gains), href: '/paiements' },
            ].map((kpi) =>
              kpi.href ? (
                <Link key={kpi.label} href={kpi.href}
                  className="rounded-2xl border border-hairline bg-surface p-6 hover:border-cyan hover-lift transition-all">
                  <div className="font-display text-2xl font-semibold text-mist">{kpi.value}</div>
                  <div className="text-sm text-fog mt-2">{kpi.label}</div>
                </Link>
              ) : (
                <div key={kpi.label} className="rounded-2xl border border-hairline bg-surface p-6">
                  <div className="font-display text-2xl font-semibold text-mist">{kpi.value}</div>
                  <div className="text-sm text-fog mt-2">{kpi.label}</div>
                </div>
              )
            )}
          </div>

          {/* Collaborations récentes */}
          <div className="rounded-2xl border border-hairline bg-surface p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-mist">Collaborations récentes</h2>
              <Link href="/collaborations" className="text-sm text-cyan hover:underline">
                Voir tout →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-surface-2 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : collabs.length === 0 ? (
              <div className="text-center py-12 text-fog">
                <div className="text-4xl mb-3">🤝</div>
                <p>Aucune collaboration pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {collabs.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    href={`/collaborations/${c.id}`}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-2 transition-colors border border-hairline hover:border-cyan hover-lift"
                  >
                    <div>
                      <div className="font-medium text-mist">{c.campagne?.titre || 'Campagne'}</div>
                      <div className="text-xs text-fog mt-0.5">
                        {new Date(c.dateInvitation).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <StatusBadge statut={c.statut} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardCreateur>
  );
}

