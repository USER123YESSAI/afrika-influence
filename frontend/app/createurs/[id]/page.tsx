'use client';

import { useState, useEffect } from 'react';
import { createurApi, formatFCFA } from '@/lib/api';
import { getTotalAudience } from '@/lib/utils';
import { MeshBackground } from '@/components/layout/MeshBackground';
import { MapPin, Users, Tag, ArrowLeft, Mail, ExternalLink, Briefcase } from 'lucide-react';
import Link from 'next/link';

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

export default function CreateurPublicProfile({ params }: { params: { id: string } }) {
  const [createur, setCreateur] = useState<any>(null);
  const [offres, setOffres]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      createurApi.getProfil(params.id),
      createurApi.getOffres(params.id).catch(() => [])
    ])
    .then(([profilData, offresData]) => {
      setCreateur(profilData);
      setOffres(Array.isArray(offresData) ? offresData : []);
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-afrika-mesh flex items-center justify-center">
        <MeshBackground />
        <div className="w-12 h-12 border-4 border-cyan/30 border-t-cyan rounded-full animate-spin z-10" />
      </div>
    );
  }

  if (error || !createur) {
    return (
      <div className="relative min-h-screen bg-afrika-mesh flex flex-col items-center justify-center p-5">
        <MeshBackground />
        <div className="z-10 bg-surface/60 backdrop-blur-md p-8 rounded-2xl border border-hairline text-center max-w-md">
          <h2 className="text-xl font-bold text-mist mb-4">Profil introuvable</h2>
          <p className="text-fog mb-6">{error || "Ce créateur n'existe pas ou a été supprimé."}</p>
          <Link href="/createurs" className="inline-flex items-center gap-2 text-cyan hover:underline">
            <ArrowLeft size={16} /> Retour à l'annuaire
          </Link>
        </div>
      </div>
    );
  }

  const totalAudience = getTotalAudience(createur.reseaux, createur.audience || 0);

  return (
    <div className="relative min-h-screen bg-afrika-mesh text-mist pb-20">
      <MeshBackground />
      
      <div className="relative mx-auto max-w-5xl px-5 py-8 sm:py-12">
        <Link href="/createurs" className="inline-flex items-center gap-2 text-fog hover:text-cyan mb-8 transition-colors">
          <ArrowLeft size={16} /> Retour à l'annuaire
        </Link>

        {/* Header Profile */}
        <div className="rounded-3xl border border-hairline bg-surface/60 backdrop-blur-md overflow-hidden shadow-2xl mb-8">
          <div className="h-32 sm:h-48 bg-gradient-to-r from-cyan/20 to-brand/20 relative">
            <div className="absolute inset-0 bg-surface/20" />
          </div>
          <div className="px-5 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 -mt-16 sm:-mt-20 mb-6">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-ink overflow-hidden bg-surface-2 relative shrink-0 shadow-xl">
                <img 
                  src={createur.photoProfilUrl ? getImageUrl(createur.photoProfilUrl) : avatarUrl(createur.nom || createur.id)} 
                  alt={createur.nom} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-mist mb-1">{createur.nom}</h1>
                <p className="font-mono text-sm text-fog mb-3">{createur.handle || `@${createur.nom.toLowerCase().replace(/\s+/g, '')}`}</p>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-xs sm:text-sm text-fog">
                  {createur.pays && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-surface-2">
                      <MapPin size={14} className="text-cyan" /> {createur.pays}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-auto flex flex-col gap-3 shrink-0">
                <Link 
                  href={`/inscription?role=ENTREPRISE`}
                  className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan to-brand text-ink font-semibold hover:opacity-90 transition-opacity"
                >
                  Proposer une collaboration
                </Link>
                <Link 
                  href="/connexion"
                  className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl border border-hairline bg-surface-2 text-mist hover:border-cyan hover:text-cyan transition-colors flex items-center justify-center gap-2"
                >
                  <Mail size={16} /> Contacter
                </Link>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6 max-w-3xl">
              <h3 className="text-lg font-display font-semibold text-mist mb-3">Biographie</h3>
              {createur.bio ? (
                <p className="text-fog leading-relaxed whitespace-pre-wrap">{createur.bio}</p>
              ) : (
                <p className="text-fog italic text-sm">Ce créateur n'a pas encore renseigné sa biographie.</p>
              )}
            </div>
            
            {/* Niches */}
            <div className="mb-2">
              <h3 className="text-lg font-display font-semibold text-mist mb-3">Niches d'expertise</h3>
              {createur.niches && createur.niches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {createur.niches.map((n: any) => (
                    <span key={n.niche} className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-3 py-1 text-xs text-mist">
                      <Tag size={12} className="text-fog" /> {n.niche}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-fog italic text-sm">Aucune niche renseignée.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Offres de services */}
            <div className="rounded-2xl border border-hairline bg-surface/60 backdrop-blur-md p-6 sm:p-8">
              <h3 className="flex items-center gap-2 text-xl font-display font-semibold text-mist mb-6">
                <Briefcase className="text-cyan" /> Services & Tarifs
              </h3>
              
              {offres.length === 0 ? (
                <p className="text-fog text-sm bg-surface-2 p-4 rounded-xl border border-hairline">
                  Ce créateur n'a pas encore publié d'offres publiques. Vous pouvez le contacter directement pour discuter d'une collaboration.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {offres.map((offre: any) => (
                    <div key={offre.id} className="p-5 rounded-xl border border-hairline bg-surface-2 hover:border-cyan/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-mist">{offre.titre}</h4>
                        <span className="px-2 py-1 bg-cyan/10 text-cyan text-xs font-mono rounded-lg border border-cyan/20">
                          {formatFCFA(offre.prix)}
                        </span>
                      </div>
                      <p className="text-sm text-fog line-clamp-3 mb-4">{offre.description}</p>
                      {offre.delaiLivraison && (
                        <p className="text-xs text-fog flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                          Livraison estimée : {offre.delaiLivraison} jours
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
