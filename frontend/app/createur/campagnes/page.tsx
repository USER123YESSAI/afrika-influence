'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardCreateur from '@/components/layout/DashboardCreateur';
import { getCampagnesPubliques, formatFCFA, favoriApi, getImageUrl } from '@/lib/api';
import { showToast } from '@/components/ui/Toast';
import SafeAvatar from '@/components/ui/SafeAvatar';

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
  budget: number | null;
  budgetDepense?: number | null;
  objectifPrincipal?: string;
  consignesContenu?: string;
  contraintesContenu?: string;
  exempleContenu?: string;
  nombreCreateursVoulus?: number;
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
  const [favoriIds, setFavoriIds] = useState<Set<string>>(new Set());
  const [togglingFavori, setTogglingFavori] = useState(false);

  // Filtres
  const [recherche, setRecherche] = useState('');
  const [pays, setPays] = useState('');
  const [secteur, setSecteur] = useState('');

  useEffect(() => {
    loadCampagnes();
  }, [recherche, pays, secteur]);

  useEffect(() => {
    favoriApi.lister()
      .then((favs: any) => setFavoriIds(new Set(favs.map((c: any) => c.id))))
      .catch(() => {});
  }, []);

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

  const handleToggleFavori = async (campagneId: string) => {
    setTogglingFavori(true);
    try {
      if (favoriIds.has(campagneId)) {
        await favoriApi.retirer(campagneId);
        setFavoriIds((prev) => { const s = new Set(prev); s.delete(campagneId); return s; });
        showToast('Retiré des favoris.', 'info');
      } else {
        await favoriApi.ajouter(campagneId);
        setFavoriIds((prev) => new Set(prev).add(campagneId));
        showToast('⭐ Ajouté aux favoris !', 'success');
      }
    } catch (e: any) {
      showToast('❌ ' + e.message, 'error');
    } finally {
      setTogglingFavori(false);
    }
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
            <h1 className="font-display text-3xl font-bold text-brand-600">Campagnes disponibles</h1>
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
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />

              <select
                value={pays}
                onChange={e => setPays(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Tous les pays</option>
                {PAYS_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>

              <select
                value={secteur}
                onChange={e => setSecteur(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Tous les secteurs</option>
                {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">{campagnes.length} campagne(s) trouvée(s)</span>
              <button
                onClick={() => { setRecherche(''); setPays(''); setSecteur(''); }}
                className="text-sm text-brand-600 hover:underline"
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
                <Link
                  href={`/createur/campagnes/${campagne.id}`}
                  key={campagne.id}
                  className="relative bg-white rounded-3xl shadow-bento p-6 hover-lift transition-all cursor-pointer border border-transparent hover:border-brand-200 block"
                >
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFavori(campagne.id); }}
                    disabled={togglingFavori}
                    title={favoriIds.has(campagne.id) ? 'Retirer des favoris' : 'Enregistrer'}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-lg hover:scale-110 transition-transform z-10"
                  >
                    {favoriIds.has(campagne.id) ? '⭐' : '☆'}
                  </button>

                  {/* Header carte */}
                  <div className="flex items-start gap-4 mb-4">
<<<<<<< Updated upstream
                    <div className="w-16 h-16 rounded-2xl bg-brand-50 border-2 border-brand-100 flex items-center justify-center flex-shrink-0">
                      {campagne.entreprise?.logoUrl ? (
                        <img src={getImageUrl(campagne.entreprise.logoUrl)} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <span className="text-2xl font-bold text-brand-600">{campagne.entreprise?.nom[0] || 'E'}</span>
                      )}
                    </div>
=======
                    <SafeAvatar
                      src={campagne.entreprise?.logoUrl}
                      name={campagne.entreprise?.nom}
                      className="w-16 h-16 rounded-2xl"
                      textClassName="text-2xl font-bold text-brand-600"
                    />
>>>>>>> Stashed changes
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
                    <div className="bg-brand-50 rounded-xl p-3 text-center">
                      <div className="font-display font-bold text-brand-600">
                        {campagne.budget !== null ? formatFCFA(campagne.budget) : 'Confidentiel'}
                      </div>
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
                  <div className="w-full mt-4 py-2.5 bg-gradient-brand text-white rounded-2xl font-semibold hover:opacity-90 transition-all text-sm text-center">
                    Voir les détails
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DashboardCreateur>
  );
}
