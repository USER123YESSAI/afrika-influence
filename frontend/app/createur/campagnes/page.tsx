'use client';

import { useState, useEffect } from 'react';
import DashboardCreateur from '@/components/layout/DashboardCreateur';
import { getCampagnesPubliques, getCampagne, formatFCFA } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';

const SECTEURS = ['MODE', 'BEAUTE', 'TECH', 'AGROALIMENTAIRE', 'SANTE', 'FINANCE', 'EDUCATION', 'TOURISME', 'AUTRE'];
const PAYS_OPTIONS = [
  { value: 'SENEGAL', label: '🇸🇳 Sénégal' }, { value: 'COTE_DIVOIRE', label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'CAMEROUN', label: '🇨🇲 Cameroun' }, { value: 'MALI', label: '🇲🇱 Mali' },
  { value: 'BURKINA_FASO', label: '🇧🇫 Burkina Faso' }, { value: 'GUINEE', label: '🇬🇳 Guinée' },
];

interface Campagne {
  id: string;
  titre: string;
  description?: string;
  budget: number;
  budgetDepense?: number;
  objectifPrincipal?: string;
  consignesContenu?: string;
  contraintesContenu?: string;
  exempleContenu?: string;
  nombreCreateursVoulus?: number;
  nombrePostsParCreateur?: number;
  statut: string;
  dateCreation: string;
  dateDebut?: string;
  dateFin?: string;
  plateformes?: Array<{ plateforme: string }>;
  entreprise: {
    id: string;
    nom: string;
    logoUrl?: string;
    secteur?: string;
    pays?: string;
    description?: string;
  };
}

export default function CampagnesCreateurPage() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampagne, setSelectedCampagne] = useState<Campagne | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filtres
  const [recherche, setRecherche] = useState('');
  const [pays, setPays] = useState('');
  const [secteur, setSecteur] = useState('');

  useEffect(() => {
    loadCampagnes();
  }, [recherche, pays, secteur]);

  const loadCampagnes = async () => {
    setLoading(true);
    try {
      const filtres: Record<string, string> = {};
      if (recherche) filtres.recherche = recherche;
      if (pays) filtres.pays = pays;
      if (secteur) filtres.secteur = secteur;

      const data: any = await getCampagnesPubliques(filtres);
      setCampagnes(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampagneDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const data: any = await getCampagne(id);
      setSelectedCampagne(data);
    } catch (error) {
      console.error('Erreur chargement détail campagne:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCardClick = (campagne: Campagne) => {
    setSelectedCampagne(campagne);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'PUBLIEE': return 'bg-green-100 text-green-700';
      case 'BROUILLON': return 'bg-gray-100 text-gray-600';
      case 'ANNULEE': return 'bg-red-100 text-red-700';
      case 'TERMINEE': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'PUBLIEE': return 'Publiée';
      case 'BROUILLON': return 'Brouillon';
      case 'ANNULEE': return 'Annulée';
      case 'TERMINEE': return 'Terminée';
      default: return statut;
    }
  };

  return (
    <DashboardCreateur>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-emerald-600">Campagnes disponibles</h1>
            <p className="text-gray-600 mt-1">Découvrez les opportunités de collaboration avec les entreprises</p>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-3xl shadow-bento p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Rechercher par titre ou description..."
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />

              <select
                value={pays}
                onChange={e => setPays(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Tous les pays</option>
                {PAYS_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>

              <select
                value={secteur}
                onChange={e => setSecteur(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Tous les secteurs</option>
                {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">{campagnes.length} campagne(s) trouvée(s)</span>
              <button
                onClick={() => { setRecherche(''); setPays(''); setSecteur(''); }}
                className="text-sm text-emerald-600 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          {/* Grille campagnes */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-3xl shadow-bento p-6 animate-pulse">
                  <div className="h-20 bg-gray-100 rounded-2xl mb-4" />
                  <div className="h-4 bg-gray-100 rounded mb-2" />
                  <div className="h-3 bg-gray-100 rounded mb-4" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : campagnes.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-bento p-16 text-center">
              <div className="text-5xl mb-4">📢</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune campagne trouvée</h3>
              <p className="text-gray-400 text-sm">Essayez d'ajuster vos filtres de recherche</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campagnes.map((campagne) => (
                <div
                  key={campagne.id}
                  className="bg-white rounded-3xl shadow-bento p-6 hover-lift transition-all cursor-pointer border border-transparent hover:border-emerald-200"
                  onClick={() => handleCardClick(campagne)}
                >
                  {/* Header carte */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center flex-shrink-0">
                      {campagne.entreprise?.logoUrl ? (
                        <img src={campagne.entreprise.logoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <span className="text-2xl font-bold text-emerald-600">{campagne.entreprise?.nom[0] || 'E'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{campagne.titre}</h3>
                      <p className="text-sm text-gray-400 truncate">{campagne.entreprise?.nom}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatutColor(campagne.statut)}`}>
                        {getStatutLabel(campagne.statut)}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {campagne.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{campagne.description}</p>
                  )}

                  {/* Statistiques */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <div className="font-display font-bold text-emerald-600">{formatFCFA(campagne.budget)}</div>
                      <div className="text-xs text-gray-500">Budget</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <div className="font-display font-bold text-blue-600">{campagne.nombreCreateursVoulus || '—'}</div>
                      <div className="text-xs text-gray-500">Créateurs</div>
                    </div>
                  </div>

                  {/* Plateformes */}
                  <div className="flex gap-2 mb-4">
                    {campagne.plateformes?.slice(0, 3).map((p) => (
                      <span key={p.plateforme} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {p.plateforme}
                      </span>
                    ))}
                    {(campagne.plateformes?.length || 0) > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        +{campagne.plateformes!.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <span>📅 {formatDate(campagne.dateDebut)} - {formatDate(campagne.dateFin)}</span>
                  </div>

                  {/* Bouton */}
                  <button className="w-full mt-4 py-2.5 bg-gradient-emerald text-white rounded-2xl font-semibold hover:opacity-90 transition-all text-sm">
                    Voir les détails
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Modal détails campagne */}
          {selectedCampagne && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCampagne(null)}>
              <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header modal */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-emerald-600">Détails de la campagne</h2>
                  <button
                    onClick={() => setSelectedCampagne(null)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6">
                  {/* Info entreprise */}
                  <div className="flex items-start gap-6 mb-8 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {selectedCampagne.entreprise?.logoUrl ? (
                        <img src={selectedCampagne.entreprise.logoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <span className="text-3xl font-bold text-emerald-600">{selectedCampagne.entreprise?.nom[0] || 'E'}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold text-gray-900">{selectedCampagne.entreprise?.nom}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        {selectedCampagne.entreprise?.secteur && (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">{selectedCampagne.entreprise.secteur}</span>
                        )}
                        {selectedCampagne.entreprise?.pays && (
                          <span>📍 {selectedCampagne.entreprise.pays.replace('_', ' ')}</span>
                        )}
                      </div>
                      {selectedCampagne.entreprise?.description && (
                        <p className="text-sm text-gray-600 mt-2">{selectedCampagne.entreprise.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Titre et statut */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-2xl font-bold text-gray-900">{selectedCampagne.titre}</h3>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatutColor(selectedCampagne.statut)}`}>
                        {getStatutLabel(selectedCampagne.statut)}
                      </span>
                    </div>
                    {selectedCampagne.description && (
                      <p className="text-gray-600">{selectedCampagne.description}</p>
                    )}
                  </div>

                  {/* Statistiques */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                      <div className="font-display text-2xl font-bold text-emerald-600">{formatFCFA(selectedCampagne.budget)}</div>
                      <div className="text-xs text-gray-500 mt-1">Budget total</div>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4 text-center">
                      <div className="font-display text-2xl font-bold text-blue-600">{selectedCampagne.nombreCreateursVoulus || '—'}</div>
                      <div className="text-xs text-gray-500 mt-1">Créateurs recherchés</div>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-4 text-center">
                      <div className="font-display text-2xl font-bold text-purple-600">{selectedCampagne.nombrePostsParCreateur || '—'}</div>
                      <div className="text-xs text-gray-500 mt-1">Posts par créateur</div>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-4 text-center">
                      <div className="font-display text-2xl font-bold text-amber-600">{selectedCampagne.plateformes?.length || 0}</div>
                      <div className="text-xs text-gray-500 mt-1">Plateformes</div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-900 mb-3">Calendrier</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm text-gray-500">Date de début</div>
                        <div className="font-medium text-gray-900">{formatDate(selectedCampagne.dateDebut)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm text-gray-500">Date de fin</div>
                        <div className="font-medium text-gray-900">{formatDate(selectedCampagne.dateFin)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Objectif */}
                  {selectedCampagne.objectifPrincipal && (
                    <div className="mb-8">
                      <h4 className="font-semibold text-gray-900 mb-3">Objectif principal</h4>
                      <p className="text-gray-600 bg-gray-50 rounded-xl p-4">{selectedCampagne.objectifPrincipal}</p>
                    </div>
                  )}

                  {/* Consignes */}
                  {selectedCampagne.consignesContenu && (
                    <div className="mb-8">
                      <h4 className="font-semibold text-gray-900 mb-3">Consignes de contenu</h4>
                      <p className="text-gray-600 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">{selectedCampagne.consignesContenu}</p>
                    </div>
                  )}

                  {/* Contraintes */}
                  {selectedCampagne.contraintesContenu && (
                    <div className="mb-8">
                      <h4 className="font-semibold text-gray-900 mb-3">Contraintes et exigences</h4>
                      <p className="text-gray-600 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">{selectedCampagne.contraintesContenu}</p>
                    </div>
                  )}

                  {/* Exemple */}
                  {selectedCampagne.exempleContenu && (
                    <div className="mb-8">
                      <h4 className="font-semibold text-gray-900 mb-3">Exemple de contenu attendu</h4>
                      <p className="text-gray-600 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">{selectedCampagne.exempleContenu}</p>
                    </div>
                  )}

                  {/* Plateformes */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-900 mb-3">Plateformes concernées</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCampagne.plateformes?.map((p) => (
                        <span key={p.plateforme} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                          {p.plateforme}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 border-t border-gray-100 bg-emerald-50 rounded-2xl p-4 text-sm text-emerald-800">
                    <p className="font-medium mb-1">💡 Comment participer ?</p>
                    <p className="text-emerald-700">L'entreprise sélectionne les créateurs en fonction de leur profil et de leurs niches. Assurez-vous que votre profil est complet et à jour pour maximiser vos chances d'être invité.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardCreateur>
  );
}
