'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createurApi, NICHES_DISPONIBLES, RESEAUX, formatFCFA } from '@/lib/api';
import Link from 'next/link';
import { Search, MapPin, Tag, Share2, Star } from 'lucide-react';

const PAYS_OPTIONS = [
  { value: 'SN', label: '🇸🇳 Sénégal' },
  { value: 'CI', label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'CM', label: '🇨🇲 Cameroun' },
  { value: 'ML', label: '🇲🇱 Mali' },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'GN', label: '🇬🇳 Guinée' },
];

const fmtAudience = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' :
  n >= 1000      ? (n / 1000).toFixed(0) + 'K' :
  String(n);

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${BASE}${url}`;
};

export default function CreateursPage({ embedded = false }: { embedded?: boolean }) {
  const searchParams = useSearchParams();
  const [createurs, setCreateurs] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [pays, setPays]           = useState(searchParams?.get('pays') ?? '');
  const [niche, setNiche]         = useState(searchParams?.get('niche') ?? '');
  const [reseau, setReseau]       = useState(searchParams?.get('reseau') ?? '');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    setLoading(true);
    const filtres: Record<string, string> = {};
    if (pays)   filtres.pays   = pays;
    if (niche)  filtres.niche  = niche;
    if (reseau) filtres.reseau = reseau;
    if (search) filtres.recherche = search;

    createurApi.lister(filtres)
      .then((data: any) => setCreateurs(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [pays, niche, reseau, search]);

  const totalAudience = (c: any) => {
    if (!c.reseaux) return c.audience || 0;
    return Object.values(c.reseaux as Record<string, any>).reduce((s: number, r: any) => s + (r?.audience || 0), 0);
  };

  return (
    <div className={`relative ${embedded ? '' : 'min-h-screen bg-stone-50'}`}>
      
      <div className={`relative mx-auto max-w-6xl px-5 ${embedded ? '' : 'py-16 sm:py-24'}`}>
        {!embedded && (
          <div className="mb-12 text-center animate-fade-in">
            <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.2em] text-brass-600 mb-4">
              Annuaire Public
            </p>
            <h1 className="font-display text-4xl font-medium sm:text-5xl lg:text-6xl text-brand-900">
              Découvrez nos <span className="italic">Créateurs</span>
            </h1>
            <p className="mt-6 text-gray-500 max-w-2xl mx-auto text-base sm:text-lg">
              Recherchez et filtrez les talents pour trouver la voix parfaite pour votre prochaine campagne.
            </p>
          </div>
        )}

        {/* Filtres avec style clair */}
        <div className="mb-10 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <select 
                value={niche} 
                onChange={e => setNiche(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-brand-900 focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400 transition-colors"
              >
                <option value="">Toutes les niches</option>
                {NICHES_DISPONIBLES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            
            <div className="relative">
              <Share2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <select 
                value={reseau} 
                onChange={e => setReseau(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-brand-900 focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400 transition-colors"
              >
                <option value="">Tous les réseaux</option>
                {RESEAUX.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Grille multi-lignes */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-44 rounded-2xl border border-gray-100 bg-white p-5 animate-pulse" />
            ))}
          </div>
        ) : createurs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-6">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-brand-900">Aucun créateur trouvé</h3>
            <p className="mt-2 text-gray-500">Essayez de modifier vos filtres de recherche.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {createurs.map((c: any) => (
              <Link
                href={`/createurs/${c.id}`}
                key={c.id}
                className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-brand-50">
                      {c.photoProfilUrl ? (
                        <img src={getImageUrl(c.photoProfilUrl)} alt={c.nom} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-semibold text-brand-700">
                          {c.nom?.[0] ?? '?'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-brand-900 transition-colors group-hover:text-brand-700">{c.nom}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400">
                        {c.pays && <MapPin size={11} />} {fmtAudience(totalAudience(c))} abonnés
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(c.niches ?? []).slice(0, 3).map((n: any) => (
                      <span key={n.niche} className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700">
                        {n.niche}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-gray-50 pt-3 text-sm">
                  <span className="font-semibold text-brand-900">
                    {c.tarifMoyen ? `Dès ${formatFCFA(c.tarifMoyen)}` : 'Tarif sur demande'}
                  </span>
                  {c.noteMoyenne ? (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Star size={12} className="fill-brass-500 text-brass-500" /> {c.noteMoyenne}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
