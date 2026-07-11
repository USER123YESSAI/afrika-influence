'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import { collabApi, initierPaiement, formatFCFA } from '@/lib/api';

export default function PaiementPage() {
  const { id } = useParams<{ id: string }>();
  const [collab, setCollab] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  useEffect(() => {
    if (!id) return;
    collabApi.detail(id)
      .then(setCollab)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleInitierPaiement = async () => {
    if (!id) return;
    setInitiating(true);
    setError('');
    try {
      const result: any = await initierPaiement({ collaborationId: id as string, methode: 'PAYTECH' });
      if (result.redirectUrl) {
        setPaymentUrl(result.redirectUrl);
        setSuccess(true);
      } else {
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'initialisation du paiement');
    } finally {
      setInitiating(false);
    }
  };

  if (loading) {
    return (
      <DashboardEntreprise>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400 animate-pulse">Chargement…</div>
        </div>
      </DashboardEntreprise>
    );
  }

  if (!collab) {
    return (
      <DashboardEntreprise>
        <div className="text-center py-20 text-gray-400">Collaboration introuvable.</div>
      </DashboardEntreprise>
    );
  }

  const campagne = collab.campagne || {};
  const createur = collab.createur || {};
  const montant = collab.totalRemuneration || 0;

  return (
    <DashboardEntreprise>
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/collaborations" className="hover:text-emerald-600">Collaborations</Link>
          <span>›</span>
          <Link href={`/collaborations/${id}`} className="hover:text-emerald-600">
            {campagne.titre}
          </Link>
          <span>›</span>
          <span className="text-gray-700">Paiement</span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && !paymentUrl && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm">
            ✅ Paiement initialisé avec succès !
          </div>
        )}

        {success && paymentUrl && (
          <div className="mb-6 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="font-semibold text-emerald-800 mb-2">Redirection vers PayTech</h3>
            <p className="text-sm text-emerald-600 mb-4">
              Vous allez être redirigé vers la plateforme de paiement sécurisée.
            </p>
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-gradient-emerald text-white rounded-2xl font-semibold hover:opacity-90 transition-all shadow-bento hover-lift"
            >
              Payer maintenant
            </a>
          </div>
        )}

        {/* Collaboration info */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Détails de la collaboration</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Campagne</span>
              <span className="font-medium text-gray-900">{campagne.titre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Créateur</span>
              <span className="font-medium text-gray-900">{createur.nom || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Statut</span>
              <span className="font-medium text-emerald-600">{collab.statut}</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Montant à payer</h2>
          <div className="text-center py-6">
            <div className="text-4xl font-bold text-emerald-600 mb-2">
              {formatFCFA(montant)}
            </div>
            <p className="text-sm text-gray-500">
              Commission plateforme incluse
            </p>
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Méthode de paiement</h2>
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
              💳
            </div>
            <div>
              <p className="font-medium text-gray-900">PayTech</p>
              <p className="text-sm text-gray-500">Paiement sécurisé via PayTech</p>
            </div>
          </div>
        </div>

        {/* Initiate payment button */}
        {!success && collab.statut === 'CONTENU_VALIDE' && (
          <button
            onClick={handleInitierPaiement}
            disabled={initiating}
            className="w-full py-4 bg-gradient-emerald text-white rounded-2xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-bento hover-lift"
          >
            {initiating ? 'Initialisation en cours...' : 'Initier le paiement'}
          </button>
        )}

        {collab.statut !== 'CONTENU_VALIDE' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-amber-800 text-sm">
              ⚠️ Le paiement n'est disponible que lorsque le contenu a été validé.
            </p>
          </div>
        )}

        {/* Back button */}
        <div className="mt-6">
          <Link href={`/collaborations/${id}`}
            className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">
            ← Retour à la collaboration
          </Link>
        </div>
      </div>
    </DashboardEntreprise>
  );
}
