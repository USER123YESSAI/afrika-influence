import Link from 'next/link';
import type { Recommandation } from '@/lib/api';

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${BASE}${url}`;
};

const avatarUrl = (seed: string) => `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`;

interface Props {
  recommandation: Recommandation;
  rank: number;
  actionButton?: React.ReactNode;
}

export default function CreateurRecommande({ recommandation, rank, actionButton }: Props) {
  const { createurId, scoreCompatibilite, raisonnement, estConsultee, createur } = recommandation;
  const score = Math.round(Number(scoreCompatibilite));
  
  const nom = createur?.nom || `Créateur #${createurId.slice(0, 8)}`;
  const photo = createur?.photoProfilUrl ? getImageUrl(createur.photoProfilUrl) : avatarUrl(nom);
  
  const getReseaux = (c: any) => {
    if (!c?.reseaux) return "-";
    let res = c.reseaux;
    if (typeof res === 'string') {
      try { res = JSON.parse(res); } catch(e) {}
    }
    if (Array.isArray(res)) {
      if (res.length === 0) return "-";
      return res.map((r: any) => {
        const name = r.plateforme || r.nom || '';
        return name.charAt(0).toUpperCase() + name.slice(1);
      }).filter(Boolean).join(', ') || "-";
    } else if (typeof res === 'object') {
      if (Object.keys(res).length === 0) return "-";
      return Object.keys(res).map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', ');
    }
    return "-";
  };
  
  return (
    <div className={`group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-hairline bg-surface ${estConsultee ? 'opacity-90' : ''}`}>
      <Link href={`/createurs/${createurId}`} className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={nom}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </Link>

      <div className="absolute top-3 left-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-brand-500 text-white font-bold text-sm shadow-lg">
        {rank}
      </div>
      
      <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
        <span className="text-brand-400 font-bold text-xs">{score}%</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 z-10 pointer-events-none">
        <h3 className="font-display text-lg text-white mb-1">{nom}</h3>
        <p className="font-mono text-[11px] text-cyan-400 line-clamp-1 mb-1">
          {createur?.niches && createur.niches.length > 0 ? createur.niches[0].niche : "Créateur"}
        </p>
        <p className="font-mono text-[11px] text-gray-300 line-clamp-1 mb-2">
          {getReseaux(createur)}
        </p>
        
        <div className="w-full bg-white/20 rounded-full h-1 mb-2">
          <div className="bg-brand-400 h-1 rounded-full" style={{ width: `${score}%` }} />
        </div>
        <p className="text-[9px] text-gray-400 leading-tight line-clamp-2">
          {raisonnement}
        </p>
        
        {actionButton && (
          <div className="mt-4 pointer-events-auto">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
}
