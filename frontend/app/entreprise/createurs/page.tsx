'use client';

import { useState, useEffect } from 'react';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
<<<<<<< Updated upstream
import { createurApi, collabApi, getMesCampagnes, NICHES_DISPONIBLES, RESEAUX, formatFCFA, getImageUrl } from '@/lib/api';
=======
import { createurApi, collabApi, getMesCampagnes, NICHES_DISPONIBLES, RESEAUX, formatFCFA } from '@/lib/api';
import { getReseauxList, getTotalAudience, getReseauxEntries } from '@/lib/utils';
>>>>>>> Stashed changes
import AuthGuard from '@/components/auth/AuthGuard';
import { showToast } from '@/components/ui/Toast';

const PAYS_OPTIONS = [
  { value: 'SN', label: '🇸🇳 Sénégal' }, { value: 'CI', label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'CM', label: '🇨🇲 Cameroun' }, { value: 'ML', label: '🇲🇱 Mali' },
  { value: 'BF', label: '🇧🇫 Burkina Faso' }, { value: 'GN', label: '🇬🇳 Guinée' },
  { value: 'TG', label: '🇹🇬 Togo' }, { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'NE', label: '🇳🇪 Niger' }, { value: 'CD', label: '🇨🇩 RDC' },
];

const AUDIENCE_RANGES = [
  { label: 'Tous', min: undefined, max: undefined },
  { label: '1K - 10K', min: 1000, max: 10000 },
  { label: '10K - 50K', min: 10000, max: 50000 },
  { label: '50K - 100K', min: 50000, max: 100000 },
  { label: '100K+', min: 100000, max: undefined },
];

interface Createur {
  id: string;
  nom: string;
  handle: string;
  bio?: string;
  photoProfilUrl?: string;
  pays: string;
  audience: number;
  verifie: boolean;
  reseaux: Record<string, { handle: string; audience: number }>;
  niches: Array<{ niche: string }>;
  offres: Array<{
    id: string;
    reseau: string;
    typeContenu: string;
    prix: number;
    delaiLivraison: number;
    description?: string;
  }>;
}

export default function CreateursEntreprisePage() {
  const [createurs, setCreateurs] = useState<Createur[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreateur, setSelectedCreateur] = useState<Createur | null>(null);
  const [showOffres, setShowOffres] = useState(false);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  // Invitation directe depuis la fiche créateur
  const [campagnesActives, setCampagnesActives] = useState<{ id: string; titre: string }[]>([]);
  const [campagneChoisie, setCampagneChoisie] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invitedFor, setInvitedFor] = useState<Set<string>>(new Set()); // "createurId:campagneId"

  useEffect(() => {
    getMesCampagnes().then((camps: any) => {
      const actives = (Array.isArray(camps) ? camps : []).filter((c: any) => ['PUBLIEE', 'EN_COURS'].includes(c.statut));
      setCampagnesActives(actives);
      if (actives.length > 0) setCampagneChoisie(actives[0].id);
    }).catch(() => {});
  }, []);

  const handleInviter = async () => {
    if (!selectedCreateur || !campagneChoisie) return;
    setInviting(true);
    try {
      await collabApi.inviter({ campagneId: campagneChoisie, createurId: selectedCreateur.id });
      setInvitedFor((prev) => new Set(prev).add(`${selectedCreateur.id}:${campagneChoisie}`));
      showToast('✅ Invitation envoyée !', 'success');
    } catch (e: any) {
      showToast('❌ ' + e.message, 'error');
    } finally {
      setInviting(false);
    }
  };

  // Filtres
  const [recherche, setRecherche] = useState('');
  const [pays, setPays] = useState('');
  const [niche, setNiche] = useState('');
  const [reseau, setReseau] = useState('');
  const [audienceRange, setAudienceRange] = useState(0);

  useEffect(() => {
    loadCreateurs();
  }, [recherche, pays, niche, reseau, audienceRange]);

  const loadCreateurs = async () => {
    setLoading(true);
    try {
      const filtres: Record<string, string> = {};
      if (recherche) filtres.recherche = recherche;
      if (pays) filtres.pays = pays;
      if (niche) filtres.niche = niche;
      if (reseau) filtres.reseau = reseau;
      
      const range = AUDIENCE_RANGES[audienceRange];
      if (range.min !== undefined) filtres.audienceMin = range.min.toString();
      if (range.max !== undefined) filtres.audienceMax = range.max.toString();

      const data: any = await createurApi.lister(filtres);
      const fetchedCreateurs = Array.isArray(data) ? data : data.data || [];
      const parsedCreateurs = fetchedCreateurs.map((c: any) => {
        let reseaux = c.reseaux;
        if (typeof reseaux === 'string') {
          try { reseaux = JSON.parse(reseaux); } catch (e) { reseaux = null; }
        }
        return { ...c, reseaux };
      });
      setCreateurs(parsedCreateurs);
    } catch (error) {
      console.error('Erreur chargement créateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAudience = (createur: Createur): number => {
    return getTotalAudience(createur.reseaux, Number(createur.audience) || 0);
  };

  const getReseauxActifs = (createur: Createur): string[] => {
    return getReseauxList(createur.reseaux);
  };

  const formatAudience = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toString();
  };

  return (
    <AuthGuard roles={['ENTREPRISE', 'PARTICULIER']}>
      <DashboardEntreprise>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-brand-600">Créateurs collaborateurs</h1>
            <p className="text-gray-600 mt-1">Consultez les profils des créateurs ayant déjà participé à des collaborations</p>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-3xl shadow-bento p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Rechercher par nom ou handle..."
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />

              <label className="sr-only" htmlFor="pays-select">Pays</label>
              <select
                id="pays-select"
                value={pays}
                onChange={e => setPays(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Tous les pays</option>
                {PAYS_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>

              <label className="sr-only" htmlFor="niche-select">Catégorie</label>
              <select
                id="niche-select"
                value={niche}
                onChange={e => setNiche(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Toutes les catégories</option>
                {NICHES_DISPONIBLES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>

              <label className="sr-only" htmlFor="reseau-select">Réseau social</label>
              <select
                id="reseau-select"
                value={reseau}
                onChange={e => setReseau(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Tous les réseaux</option>
                {RESEAUX.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <label className="sr-only" htmlFor="audience-select">Plage d’audience</label>
              <select
                id="audience-select"
                value={audienceRange}
                onChange={e => setAudienceRange(Number(e.target.value))}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {AUDIENCE_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
              </select>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">{createurs.length} créateur(s) trouvé(s)</span>
              <button
                onClick={() => { setRecherche(''); setPays(''); setNiche(''); setReseau(''); setAudienceRange(0); }}
                className="text-sm text-brand-600 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          {/* Grille créateurs */}
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
          ) : createurs.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-bento p-16 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun créateur trouvé</h3>
              <p className="text-gray-400 text-sm">Essayez d'ajuster vos filtres de recherche</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-4 font-medium">Créateur</th>
                      <th className="px-6 py-4 font-medium">Audience</th>
                      <th className="px-6 py-4 font-medium">Offres</th>
                      <th className="px-6 py-4 font-medium">Niches</th>
                      <th className="px-6 py-4 font-medium">Réseaux</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {createurs.map(createur => (
                      <tr key={createur.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedCreateur(createur)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {createur.photoProfilUrl && !imgError[createur.id] ? (
                                <img 
                                  src={getImageUrl(createur.photoProfilUrl)}
                                  alt="" 
                                  className="w-full h-full object-cover"
                                  onError={() => setImgError(prev => ({ ...prev, [createur.id]: true }))}
                                />
                              ) : (
                                <span className="text-brand-600 font-bold">{createur.nom[0]}</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-900">{createur.nom}</span>
                                {createur.verifie && <span className="text-brand-500 text-xs" title="Vérifié">✓</span>}
                              </div>
                              <div className="text-xs text-gray-400">{createur.handle}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-brand-600">{formatAudience(totalAudience(createur))}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {createur.offres?.length || 0}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {createur.niches?.slice(0, 2).map((n) => (
                              <span key={n.niche} className="text-[10px] px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full">
                                {n.niche}
                              </span>
                            ))}
                            {(createur.niches?.length || 0) > 2 && (
                              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                +{createur.niches!.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {getReseauxActifs(createur).slice(0, 3).map((r) => (
                              <span key={r} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedCreateur(createur); }}
                            className="text-xs px-4 py-1.5 bg-gradient-brand text-white rounded-xl font-medium hover:opacity-90 transition-all"
                          >
                            Voir profil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal profil détaillé */}
          {selectedCreateur && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCreateur(null)}>
              <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header modal */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-100 px-8 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {selectedCreateur.photoProfilUrl && !imgError[selectedCreateur.id] ? (
                        <img 
                          src={getImageUrl(selectedCreateur.photoProfilUrl)}
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={() => setImgError(prev => ({ ...prev, [selectedCreateur.id]: true }))}
                        />
                      ) : (
                        <span className="text-lg font-bold text-brand-600">{selectedCreateur.nom[0]}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
                        {selectedCreateur.nom}
                        {selectedCreateur.verifie && (
                          <span className="text-brand-500 text-sm" title="Profil vérifié">✓</span>
                        )}
                      </h2>
                      <p className="text-sm text-gray-500">{selectedCreateur.handle}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCreateur(null)}
                    className="text-gray-400 hover:text-gray-900 p-2 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-8">
                  {/* Inviter directement */}
                  <div className="mb-8 p-5 bg-brand-50 border border-brand-100 rounded-2xl">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Inviter sur une campagne</h4>
                    {campagnesActives.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Aucune campagne publiée pour l'instant.{' '}
                        <a href="/campagnes/nouvelle" className="text-brand-600 hover:underline font-medium">Créer une campagne</a>
                      </p>
                    ) : invitedFor.has(`${selectedCreateur.id}:${campagneChoisie}`) ? (
                      <p className="text-sm text-brand-700 font-medium">✓ Invitation envoyée pour cette campagne.</p>
                    ) : (
                      <div className="flex gap-3">
                        <select
                          value={campagneChoisie}
                          onChange={(e) => setCampagneChoisie(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        >
                          {campagnesActives.map((c) => <option key={c.id} value={c.id}>{c.titre}</option>)}
                        </select>
                        <button
                          onClick={handleInviter}
                          disabled={inviting}
                          className="px-5 py-2.5 bg-gradient-brand text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                          {inviting ? 'Envoi…' : 'Inviter'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {selectedCreateur.bio && (
                    <div className="mb-8 max-w-2xl">
                      <p className="text-gray-600 leading-relaxed">{selectedCreateur.bio}</p>
                    </div>
                  )}

                  {/* Statistiques Minimalistes */}
                  <div className="flex items-center justify-between border-y border-gray-100 py-6 mb-10">
                    <div className="text-center px-4">
                      <div className="font-display text-3xl font-bold text-gray-900">{formatAudience(totalAudience(selectedCreateur))}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider mt-1 font-medium">Audience totale</div>
                    </div>
                    <div className="w-px h-12 bg-gray-100"></div>
                    <div className="text-center px-4">
                      <div className="font-display text-3xl font-bold text-gray-900">{getReseauxActifs(selectedCreateur).length}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider mt-1 font-medium">Réseaux actifs</div>
                    </div>
                    <div className="w-px h-12 bg-gray-100"></div>
                    <div className="text-center px-4">
                      <div className="font-display text-3xl font-bold text-gray-900">{selectedCreateur.niches?.length || 0}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider mt-1 font-medium">Niches</div>
                    </div>
                    <div className="w-px h-12 bg-gray-100"></div>
                    <div className="text-center px-4">
                      <div className="font-display text-3xl font-bold text-gray-900">{selectedCreateur.offres?.length || 0}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider mt-1 font-medium">Offres</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                    {/* Réseaux sociaux */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Présence en ligne</h4>
                      <div className="space-y-4">
                        {getReseauxEntries(selectedCreateur.reseaux).map(([reseau, data]: [string, any]) => (
                          <div key={reseau} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                            <div>
                              <div className="font-medium text-gray-900">{reseau}</div>
                              {data?.handle && <div className="text-sm text-gray-500">{data.handle}</div>}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{formatAudience(data?.audience || 0)}</div>
                              <div className="text-xs text-gray-400">abonnés</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Niches */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Centres d'intérêt</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCreateur.niches?.map((n) => (
                          <span key={n.niche} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-brand-200 hover:bg-brand-50 transition-colors">
                            {n.niche}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Offres */}
                  <div className="border-t border-gray-100 pt-10">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Offres et prestations</h4>
                      <button
                        onClick={() => setShowOffres(!showOffres)}
                        className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors"
                      >
                        {showOffres ? 'Masquer' : 'Voir toutes'}
                      </button>
                    </div>
                    
                    {(!selectedCreateur.offres || selectedCreateur.offres.length === 0) ? (
                      <div className="bg-gray-50 rounded-xl p-8 text-center">
                        <div className="text-3xl mb-2">📦</div>
                        <p className="text-gray-400 text-sm">Aucune offre disponible pour le moment</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(showOffres ? selectedCreateur.offres : selectedCreateur.offres.slice(0, 3)).map((offre) => (
                          <div key={offre.id} className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 hover:border-gray-200 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="font-semibold text-gray-900">{offre.typeContenu}</div>
                                <div className="text-sm font-medium text-brand-600 mt-0.5">{offre.reseau}</div>
                              </div>
                              <div className="font-bold text-gray-900 text-lg">{formatFCFA(offre.prix)}</div>
                            </div>
                            {offre.description && (
                              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{offre.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                              <span>⏱ Délai estimé : {offre.delaiLivraison} jours</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardEntreprise>
    </AuthGuard>
  );
}
