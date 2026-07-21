'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import { getCampagnesPubliques, getCampagne, formatFCFA, collabApi, favoriApi, type Campagne } from '@/lib/api';
import { showToast } from '@/components/ui/Toast';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

export default function CampagneImmersivePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [ordre, setOrdre] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [postulating, setPostulating] = useState(false);
  const [postule, setPostule] = useState(false);
  const [favori, setFavori] = useState(false);
  const [togglingFavori, setTogglingFavori] = useState(false);

  // Liste ordonnée de la marketplace, pour la navigation précédent/suivant
  useEffect(() => {
    getCampagnesPubliques()
      .then((data: any) => setOrdre((Array.isArray(data) ? data : []).map((c: any) => c.id)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setPostule(false);
    Promise.all([
      getCampagne(id),
      favoriApi.lister().catch(() => []),
    ]).then(([c, favs]: any) => {
      setCampagne(c);
      setFavori((favs || []).some((f: any) => f.id === id));
    }).catch((e) => showToast('❌ ' + e.message, 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const index = ordre.indexOf(id);
  const precedent = index > 0 ? ordre[index - 1] : null;
  const suivant = index >= 0 && index < ordre.length - 1 ? ordre[index + 1] : null;

  const handlePostuler = async () => {
    if (!id) return;
    setPostulating(true);
    try {
      await collabApi.postuler(id);
      setPostule(true);
      showToast('✅ Candidature envoyée !', 'success');
    } catch (e: any) {
      showToast('❌ ' + e.message, 'error');
    } finally {
      setPostulating(false);
    }
  };

  const handleToggleFavori = async () => {
    if (!id) return;
    setTogglingFavori(true);
    try {
      if (favori) { await favoriApi.retirer(id); setFavori(false); showToast('Retiré des favoris.', 'info'); }
      else { await favoriApi.ajouter(id); setFavori(true); showToast('⭐ Ajouté aux favoris !', 'success'); }
    } catch (e: any) {
      showToast('❌ ' + e.message, 'error');
    } finally {
      setTogglingFavori(false);
    }
  };

  if (loading || !campagne) {
    return (
      <AuthGuard roles={['CREATEUR']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-400 animate-pulse">Chargement…</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard roles={['CREATEUR']}>
      <div className="min-h-screen bg-gray-50">
        {/* Barre de navigation immersive */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 sm:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => precedent && router.push(`/createur/campagnes/${precedent}`)}
            disabled={!precedent}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Précédente
          </button>

          <Link href="/createur/campagnes"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:opacity-90 transition-opacity">
            Retour à la marketplace
          </Link>

          <button
            onClick={() => suivant && router.push(`/createur/campagnes/${suivant}`)}
            disabled={!suivant}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Suivante →
          </button>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          {/* En-tête entreprise */}
          <div className="flex items-start gap-5 mb-8">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {campagne.entreprise?.logoUrl ? (
                <img src={campagne.entreprise.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-emerald-600">{campagne.entreprise?.nom?.[0] || 'E'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl font-bold text-gray-900">{campagne.titre}</h1>
              <p className="text-gray-500 mt-1">{campagne.entreprise?.nom}</p>
              {campagne.entreprise?.secteur && (
                <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  {campagne.entreprise.secteur}
                </span>
              )}
            </div>
            <button
              onClick={handleToggleFavori}
              disabled={togglingFavori}
              title={favori ? 'Retirer des favoris' : 'Enregistrer'}
              className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-xl hover:scale-110 transition-transform shrink-0"
            >
              {favori ? '⭐' : '☆'}
            </button>
          </div>

          {/* Statistiques clés */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="font-display text-xl font-bold text-emerald-600">
                {campagne.budget !== null ? formatFCFA(campagne.budget) : 'Confidentiel'}
              </div>
              <div className="text-xs text-gray-400 mt-1">Budget</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="font-display text-xl font-bold text-gray-900">{campagne.nombreCreateursVoulus ?? '—'}</div>
              <div className="text-xs text-gray-400 mt-1">Créateurs recherchés</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="font-display text-xl font-bold text-gray-900">{campagne.plateformes?.length ?? 0}</div>
              <div className="text-xs text-gray-400 mt-1">Plateformes</div>
            </div>
          </div>

          {campagne.description && (
            <p className="text-gray-600 leading-relaxed mb-8">{campagne.description}</p>
          )}

          {/* Contenu détaillé */}
          <div className="space-y-6 mb-8">
            {campagne.objectifPrincipal && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Objectif principal</h3>
                <p className="text-gray-600 bg-white rounded-2xl border border-gray-100 p-4">{campagne.objectifPrincipal}</p>
              </div>
            )}
            {campagne.consignesContenu && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Consignes de contenu</h3>
                <p className="text-gray-600 bg-amber-50 rounded-2xl border border-amber-100 p-4 whitespace-pre-wrap">{campagne.consignesContenu}</p>
              </div>
            )}
            {campagne.contraintesContenu && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Contraintes</h3>
                <p className="text-red-600 bg-red-50 rounded-2xl border border-red-100 p-4 whitespace-pre-wrap">{campagne.contraintesContenu}</p>
              </div>
            )}
            {campagne.exempleContenu && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Exemple de contenu attendu</h3>
                <p className="text-gray-600 bg-white rounded-2xl border border-gray-100 p-4 whitespace-pre-wrap">{campagne.exempleContenu}</p>
              </div>
            )}
          </div>

          {/* Plateformes */}
          {campagne.plateformes && campagne.plateformes.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Plateformes concernées</h3>
              <div className="flex flex-wrap gap-2">
                {campagne.plateformes.map((p) => (
                  <span key={p.id} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    {p.plateforme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Calendrier */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-xs text-gray-400 mb-1">Date de début</div>
              <div className="font-medium text-gray-900">{fmtDate(campagne.dateDebut)}</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-xs text-gray-400 mb-1">Date de fin</div>
              <div className="font-medium text-gray-900">{fmtDate(campagne.dateFin)}</div>
            </div>
          </div>

          {/* Action */}
          {postule ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center text-emerald-800 font-medium">
              ✓ Candidature envoyée — vous serez notifié de la réponse de la marque.
            </div>
          ) : campagne.statut !== 'PUBLIEE' && campagne.statut !== 'EN_COURS' ? (
            <div className="bg-gray-100 border border-gray-200 rounded-2xl p-5 text-center text-gray-500">
              Cette campagne n'accepte plus de candidatures.
            </div>
          ) : (
            <button
              onClick={handlePostuler}
              disabled={postulating}
              className="w-full py-4 bg-gradient-emerald text-white rounded-2xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-bento text-lg"
            >
              {postulating ? 'Envoi…' : 'Postuler à cette campagne'}
            </button>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
