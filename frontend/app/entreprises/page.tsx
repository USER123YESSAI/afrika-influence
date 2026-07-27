'use client';

<<<<<<< Updated upstream
import { useState, useEffect } from 'react';
import { getEntreprisesPubliques } from '@/lib/api';
import Link from 'next/link';
import { Search, MapPin, Briefcase, TrendingUp } from 'lucide-react';

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
  const [search, setSearch]       = useState('');

  useEffect(() => {
    setLoading(true);
    const filtres: Record<string, string> = {};
    if (pays)    filtres.pays = pays;
    if (secteur) filtres.secteur = secteur;
    if (search)  filtres.recherche = search;

    getEntreprisesPubliques(filtres)
      .then((data: any) => setEntreprises(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [pays, secteur, search]);

  return (
    <div className={`relative ${embedded ? '' : 'min-h-screen bg-stone-50'}`}>
      
      <div className={`relative mx-auto max-w-6xl px-5 ${embedded ? '' : 'py-16 sm:py-24'}`}>
        {!embedded && (
          <div className="mb-12 text-center animate-fade-in">
            <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.2em] text-brass-600 mb-4">
              Annuaire Public
            </p>
            <h1 className="font-display text-4xl font-medium sm:text-5xl lg:text-6xl text-brand-900">
              Découvrez nos <span className="italic">Marques</span>
            </h1>
            <p className="mt-6 text-gray-500 max-w-2xl mx-auto text-base sm:text-lg">
              Explorez les entreprises qui font confiance à notre plateforme pour leurs campagnes d'influence.
            </p>
          </div>
        )}

        {/* Filtres avec style clair */}
        <div className="mb-10 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher par nom..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-brand-900 placeholder-gray-400 focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400 transition-colors" 
              />
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <select 
                value={pays} 
                onChange={e => setPays(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-brand-900 focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400 transition-colors"
              >
                <option value="">Tous les pays</option>
                {PAYS_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <select 
                value={secteur} 
                onChange={e => setSecteur(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-brand-900 focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400 transition-colors"
              >
                <option value="">Tous les secteurs</option>
                {SECTEURS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Grille des entreprises */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-32 rounded-2xl border border-gray-100 bg-white p-5 animate-pulse" />
            ))}
          </div>
        ) : entreprises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-6">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-brand-900">Aucune entreprise trouvée</h3>
            <p className="mt-2 text-gray-500">Essayez de modifier vos filtres de recherche.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {entreprises.map((e: any) => (
              <Link
                href={`/entreprises/${e.id}`}
                key={e.id}
                className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-brand-50 p-1.5">
                      {e.logoUrl ? (
                        <img src={getImageUrl(e.logoUrl)} alt={e.nom} className="h-full w-full object-cover rounded-md" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-bold text-brand-700">
                          {e.nom?.[0] ?? '?'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-brand-900 transition-colors group-hover:text-brand-700">{e.nom}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {e.secteur === 'AUTRE' ? e.secteurPersonnalise : e.secteur?.replace('_', ' ') || 'Secteur non spécifié'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-gray-50 pt-3 text-xs text-gray-500">
                  {e.pays && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-gray-400" /> 
                      <span className="truncate">{PAYS_OPTIONS.find(p => p.value === e.pays)?.label || e.pays}</span>
                    </div>
                  )}
                  {e.nombreCampagnes !== undefined && e.nombreCampagnes > 0 && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-brass-500" /> 
                      <span className="font-medium text-brand-900">{e.nombreCampagnes} campagne{e.nombreCampagnes > 1 ? 's' : ''} active{e.nombreCampagnes > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
=======
import EntreprisesContent from '@/components/entreprises/EntreprisesContent';

export default function EntreprisesPage() {
  return <EntreprisesContent embedded={false} />;
>>>>>>> Stashed changes
}
