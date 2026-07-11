'use client';

import { useState, useEffect } from 'react';
import { createurApi, NICHES_DISPONIBLES, RESEAUX } from '@/lib/api';
import Link from 'next/link';
import { Search, MapPin, Tag, Share2, Users } from 'lucide-react';
import { MeshBackground } from '@/components/layout/MeshBackground';

const PAYS_OPTIONS = [
  { value: 'SN', label: '🇸🇳 Sénégal' },
  { value: 'CI', label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'CM', label: '🇨🇲 Cameroun' },
  { value: 'ML', label: '🇲🇱 Mali' },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'GN', label: '🇬🇳 Guinée' },
];

const fmt = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' :
  n >= 1000      ? (n / 1000).toFixed(0) + 'K' :
  String(n);

const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0b1114,101a1e&radius=0`;

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${BASE}${url}`;
};

export default function CreateursPage() {
  const [createurs, setCreateurs] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [pays, setPays]           = useState('');
  const [niche, setNiche]         = useState('');
  const [reseau, setReseau]       = useState('');
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
    <div className="relative min-h-screen bg-afrika-mesh text-mist">
      <MeshBackground />
      
      <div className="relative mx-auto max-w-7xl px-5 py-12 sm:py-20">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan mb-4">Annuaire Public</p>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl lg:text-6xl text-mist">
            Découvrez nos <span className="text-gradient-afrika">Créateurs</span>
          </h1>
          <p className="mt-6 text-fog max-w-2xl mx-auto text-base sm:text-lg">
            Recherchez et filtrez les talents pour trouver la voix parfaite pour votre prochaine campagne.
          </p>
        </div>

        {/* Filtres avec design Glassmorphism */}
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
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" size={18} />
              <select 
                value={niche} 
                onChange={e => setNiche(e.target.value)}
                className="w-full appearance-none rounded-xl border border-hairline bg-surface-2 pl-10 pr-4 py-3 text-sm text-mist focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan transition-colors"
              >
                <option value="" className="bg-ink">Toutes les niches</option>
                {NICHES_DISPONIBLES.map(n => <option key={n} value={n} className="bg-ink">{n}</option>)}
              </select>
            </div>
            
            <div className="relative">
              <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" size={18} />
              <select 
                value={reseau} 
                onChange={e => setReseau(e.target.value)}
                className="w-full appearance-none rounded-xl border border-hairline bg-surface-2 pl-10 pr-4 py-3 text-sm text-mist focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan transition-colors"
              >
                <option value="" className="bg-ink">Tous les réseaux</option>
                {RESEAUX.map(r => <option key={r} value={r} className="bg-ink">{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Liste défilante des créateurs */}
        {loading ? (
          <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory hide-scrollbar">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-80 w-[280px] shrink-0 snap-start rounded-2xl border border-hairline bg-surface/40 backdrop-blur-sm animate-pulse" />
            ))}
          </div>
        ) : createurs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-surface-2 p-6">
              <Search className="h-8 w-8 text-fog" />
            </div>
            <h3 className="text-xl font-medium text-mist">Aucun créateur trouvé</h3>
            <p className="mt-2 text-fog">Essayez de modifier vos filtres de recherche.</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory hide-scrollbar">
            {createurs.map((c: any) => (
              <div 
                key={c.id} 
                className="group flex flex-col w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl border border-hairline bg-surface/60 backdrop-blur-md transition-all hover:border-cyan/50 hover:shadow-[0_0_30px_-5px_rgba(45,212,191,0.15)] hover:-translate-y-1"
              >
                {/* En-tête / Photo */}
                <div className="relative h-48 overflow-hidden bg-surface-2">
                  <img 
                    src={c.photoProfilUrl ? getImageUrl(c.photoProfilUrl) : avatarUrl(c.nom || c.id)} 
                    alt={`Photo de ${c.nom}`} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
                  
                  {/* Badge Audience */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-hairline bg-ink/80 px-2.5 py-1 backdrop-blur-md">
                    <Users size={12} className="text-cyan" />
                    <span className="font-mono text-xs font-medium text-mist">{fmt(totalAudience(c))}</span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3">
                    <h3 className="font-display text-lg font-semibold text-mist line-clamp-1 group-hover:text-cyan transition-colors">{c.nom}</h3>
                    <p className="font-mono text-xs text-fog line-clamp-1">{c.handle || `@${c.nom.toLowerCase().replace(/\s+/g, '')}`}</p>
                  </div>
                  
                  {/* Informations */}
                  <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fog">
                    {c.pays && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} /> {PAYS_OPTIONS.find(p => p.value === c.pays)?.label || c.pays}
                      </span>
                    )}
                    {c.niches && c.niches.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Tag size={14} /> 
                        <div className="flex gap-1">
                          {c.niches.slice(0, 2).map((n: any, i: number) => (
                            <span key={i} className="rounded-full border border-hairline px-2 py-0.5">{n.niche}</span>
                          ))}
                        </div>
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-hairline">
                    <Link 
                      href={`/createurs/${c.id}`}
                      className="block w-full rounded-xl bg-surface-2 py-2.5 text-center text-sm font-medium text-mist transition-colors hover:bg-cyan/10 hover:text-cyan"
                    >
                      Voir le profil complet
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
