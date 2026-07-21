'use client';
import { useEffect, useState } from 'react';
import DashboardModerateur from '@/components/layout/DashboardModerateur';
import { moderateurApi } from '@/lib/api';
import Link from 'next/link';

export default function ModerateurDashboard() {
  const [stats, setStats] = useState({
    profilsEnAttente: 0,
    campagnesAControler: 0,
    signalementsEnAttente: 0,
    soumissionsRecentes: 0,
    actionsAujourdhui: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moderateurApi.getDashboard()
      .then((d: any) => setStats(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardModerateur>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-mist">Vue d'ensemble</h1>
          <p className="text-fog mt-1">Tableau de bord modérateur</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Profils en attente',      value: stats.profilsEnAttente,     icon: '👤', href: '/moderateur/profils' },
            { label: 'Campagnes à contrôler',   value: stats.campagnesAControler,  icon: '📢', href: '/moderateur/campagnes' },
            { label: 'Signalements en attente', value: stats.signalementsEnAttente, icon: '🚩', href: '/moderateur/signalements' },
            { label: 'Soumissions (7 derniers jours)', value: stats.soumissionsRecentes, icon: '📋', href: '/moderateur/contenus' },
          ].map((k) => (
            <Link key={k.label} href={k.href}
              className="rounded-2xl border border-hairline bg-surface p-5 shadow-bento hover-lift transition-all">
              <div className="text-2xl mb-2">{k.icon}</div>
              <div className="font-display text-2xl font-semibold text-mist">
                {loading ? '—' : k.value}
              </div>
              <div className="text-sm text-fog mt-1">{k.label}</div>
            </Link>
          ))}
        </div>

        {/* Actions du jour */}
        <div className="rounded-2xl border border-hairline bg-surface p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-semibold text-mist">Mes actions récentes</h2>
            <Link href="/moderateur/historique" className="text-sm text-cyan hover:underline">
              Voir tout →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-surface-2 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-fog">
              <div className="text-3xl mb-2">⚡</div>
              <p className="font-medium text-mist text-lg">{stats.actionsAujourdhui}</p>
              <p className="text-sm mt-1">action{stats.actionsAujourdhui > 1 ? 's' : ''} effectuée{stats.actionsAujourdhui > 1 ? 's' : ''} aujourd'hui</p>
            </div>
          )}
        </div>
      </div>
    </DashboardModerateur>
  );
}
