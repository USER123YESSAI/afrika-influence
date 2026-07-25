'use client';
import { useEffect, useState } from 'react';
import DashboardAdmin from '@/components/layout/DashboardAdmin';
import { moderateurApi } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    signalementsEnAttente: 0,
    actionsAujourdhui: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // L'admin a aussi accès aux stats du modérateur
    moderateurApi.getDashboard()
      .then((d: any) => setStats(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardAdmin title="Vue d'ensemble" subtitle="Tableau de bord Administrateur">
      <div className="max-w-6xl mx-auto">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Signalements en attente', value: stats.signalementsEnAttente, icon: '🚩', href: '/admin/signalements' },
            { label: 'Utilisateurs', value: 'Gérer', icon: '👥', href: '/admin/utilisateurs' },
            { label: 'Actions d\'audit du jour', value: stats.actionsAujourdhui, icon: '⚡', href: '/admin/logs' },
          ].map((k) => (
            <Link key={k.label} href={k.href}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-bento hover-lift transition-all">
              <div className="text-2xl mb-2">{k.icon}</div>
              <div className="font-display text-2xl font-semibold text-gray-900">
                {loading ? '—' : k.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{k.label}</div>
            </Link>
          ))}
        </div>

        {/* Liens rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">Accès rapides</h2>
            <div className="space-y-3">
              <Link href="/admin/utilisateurs" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-brand-50 transition-colors">
                <span className="font-medium text-gray-700">Gestion des Utilisateurs</span>
                <span className="text-brand-600">→</span>
              </Link>
              <Link href="/admin/signalements" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-brand-50 transition-colors">
                <span className="font-medium text-gray-700">Traitement des Signalements</span>
                <span className="text-brand-600">→</span>
              </Link>
              <Link href="/admin/logs" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-brand-50 transition-colors">
                <span className="font-medium text-gray-700">Consulter le Journal d'Audit</span>
                <span className="text-brand-600">→</span>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gradient-brand text-white p-6 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="text-4xl mb-3">🛡️</div>
            <h2 className="font-display text-xl font-semibold mb-2">Espace de Super-Administration</h2>
            <p className="text-brand-50 text-sm">
              Vous avez un contrôle complet sur la plateforme. Toutes les actions de modération sont traçables dans le Journal d'audit pour garantir la transparence.
            </p>
          </div>
        </div>
      </div>
    </DashboardAdmin>
  );
}
