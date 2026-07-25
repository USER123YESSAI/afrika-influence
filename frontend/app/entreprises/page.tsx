'use client';

import { useState, useEffect } from 'react';
import { getEntreprisesPubliques } from '@/lib/api';
import Link from 'next/link';
import { Search, MapPin, Briefcase, TrendingUp, Users } from 'lucide-react';
import { MeshBackground } from '@/components/layout/MeshBackground';

const SECTEURS = [
  'MODE', 'BEAUTE', 'TECH', 'AGROALIMENTAIRE', 'SANTE', 
  'FINANCE', 'EDUCATION', 'TOURISME', 'AUTRE'
];

const PAYS_OPTIONS = [
  { value: 'SENEGAL', label: '🇸🇳 Sénégal' },
  { value: 'COTE_DIVOIRE', label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'CAMEROUN', label: '🇨🇲 Cameroun' },
  { value: 'MALI', label: '🇲🇱 Mali' },
  { value: 'BURKINA_FASO', label: '🇧🇫 Burkina Faso' },
  { value: 'GUINEE', label: '🇬🇳 Guinée' },
];

const logoUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0b1114`;

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${BASE}${url}`;
};

export default function EntreprisesPage({ embedded = false }: { embedded?: boolean }) {
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [pays, setPays]           = useState('');
  const [secteur, setSecteur]     = useState('');
  const [type, setType]           = useState(''); // '', 'ENTREPRISE', 'PARTICULIER'
  const [search, setSearch]       = useState('');

  useEffect(() => {
    setLoading(true);
    const filtres: Record<string, string> = {};
    if (pays)    filtres.pays = pays;
    if (secteur) filtres.secteur = secteur;
    if (type)    filtres.type = type;
    if (search)  filtres.recherche = search;

    getEntreprisesPubliques(filtres)
      .then((data: any) => setEntreprises(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [pays, secteur, type, search]);

  return (
    <div className={`relative text-mist ${embedded ? '' : 'min-h-screen bg-afrika-mesh'}`}>
      {!embedded && <MeshBackground />}
      
      <div className={`relative mx-auto max-w-7xl px-5 ${embedded ? 'py-8' : 'py-12 sm:py-20'}`}>
        {!embedded && (
          <div className="mb-12 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan mb-4">Annuaire Public</p>
            <h1 className="font-display text-4xl font-semibold sm:text-5xl lg:text-6xl text-mist">
              Découvrez nos <span className="text-gradient-afrika">Marques</span>
            </h1>
            <p className="mt-6 text-fog max-w-2xl mx-auto text-base sm:text-lg">
              Explorez les entreprises qui font confiance à notre plateforme pour leurs campagnes d'influence.
            </p>
          </div>
        )}

        {/* Filtres */}
        <div className="mb-10 rounded-2xl border border-hairline bg-surface/60 backdrop-blur-md p-4 sm:p-6 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fog" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher par nom..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-surface-2 pl-10 pr-4 py-3 text-sm text-mist placeholder-fog focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan transition-colors" 
              />
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" size={18} />
              <select 
                value={pays} 
                onChange={e => setPays(e.target.value)}
                className="w-full appearance-none rounded-xl border border-hairline bg-surface-2 pl-10 pr-4 py-3 text-sm text-mist focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan transition-colors"
              >
                <option value="" className="bg-ink">Tous les pays</option>
                {PAYS_OPTIONS.map(p => <option key={p.value} value={p.value} className="bg-ink">{p.label}</option>)}
              </select>
            </div>
            
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" size={18} />
              <select 
                value={secteur} 
                onChange={e => setSecteur(e.target.value)}
                className="w-full appearance-none rounded-xl border border-hairline bg-surface-2 pl-10 pr-4 py-3 text-sm text-mist focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan transition-colors"
              >
                <option value="" className="bg-ink">Tous les secteurs</option>
                {SECTEURS.map(s => <option key={s} value={s} className="bg-ink">{s.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" size={18} />
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-hairline bg-surface-2 pl-10 pr-4 py-3 text-sm text-mist focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan transition-colors"
              >
                <option value="" className="bg-ink">Marques et particuliers</option>
                <option value="ENTREPRISE" className="bg-ink">Entreprises uniquement</option>
                <option value="PARTICULIER" className="bg-ink">Particuliers uniquement</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Grille des entreprises */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-64 rounded-2xl border border-hairline bg-surface/40 backdrop-blur-sm animate-pulse" />
            ))}
          </div>
        ) : entreprises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-surface-2 p-6">
              <Search className="h-8 w-8 text-fog" />
            </div>
            <h3 className="text-xl font-medium text-mist">Aucune entreprise trouvée</h3>
            <p className="mt-2 text-fog">Essayez de modifier vos filtres de recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {entreprises.map((e: any) => (
              <div 
                key={e.id} 
                className="group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface/60 backdrop-blur-md transition-all hover:border-cyan/50 hover:shadow-[0_0_30px_-5px_rgba(45,212,191,0.15)] hover:-translate-y-1 p-5"
              >
                {/* En-tête / Logo */}
                <div className="mb-4 flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-hairline bg-surface-2">
                    <img 
                      src={e.logoUrl ? getImageUrl(e.logoUrl) : logoUrl(e.nom || e.id)} 
                      alt={`Logo de ${e.nom}`} 
                      className="h-full w-full object-cover p-2"
                    />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-mist line-clamp-1 group-hover:text-cyan transition-colors">{e.nom}</h3>
                    <p className="font-mono text-xs text-fog line-clamp-1 flex items-center gap-1.5">
                      {e.type === 'PARTICULIER' && (
                        <span className="inline-block rounded-full bg-cyan/15 text-cyan px-2 py-0.5 text-[10px] uppercase tracking-wide">Particulier</span>
                      )}
                      {e.secteur === 'AUTRE' ? e.secteurPersonnalise : e.secteur?.replace('_', ' ') || (e.type === 'PARTICULIER' ? '' : 'Non spécifié')}
                    </p>
                  </div>
                </div>
                
                <p className="mb-5 text-sm text-fog line-clamp-3 flex-1">
                  {e.description || "Cette entreprise n'a pas encore ajouté de description à son profil public."}
                </p>

                {/* Informations */}
                <div className="mb-5 grid grid-cols-2 gap-2 text-xs text-fog">
                  {e.pays && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
                      <MapPin size={14} className="text-cyan" /> 
                      <span className="truncate">{PAYS_OPTIONS.find(p => p.value === e.pays)?.label || e.pays}</span>
                    </div>
                  )}
                  {e.nombreCampagnes !== undefined && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
                      <TrendingUp size={14} className="text-cyan" /> 
                      <span>{e.nombreCampagnes} campagne{e.nombreCampagnes !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Bouton Action */}
                <div className="mt-auto">
                  <Link 
                    href={`/entreprises/${e.id}`}
                    className="block w-full rounded-xl border border-hairline bg-surface-2 py-2.5 text-center text-sm font-medium text-mist transition-colors hover:border-cyan hover:bg-cyan/10 hover:text-cyan"
                  >
                    Voir le profil complet
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
