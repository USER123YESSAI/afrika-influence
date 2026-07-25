'use client';

import { useState, useEffect } from 'react';
import { getEntreprise } from '@/lib/api';
import { MeshBackground } from '@/components/layout/MeshBackground';
import { MapPin, ArrowLeft, Mail, Briefcase } from 'lucide-react';
import Link from 'next/link';

const logoUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0b1114`;

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${BASE}${url}`;
};

export default function EntreprisePublicProfile({ params }: { params: { id: string } }) {
  const [entreprise, setEntreprise] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    setLoading(true);
    getEntreprise(params.id)
      .then(data => setEntreprise(data))
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

  if (error || !entreprise) {
    return (
      <div className="relative min-h-screen bg-afrika-mesh flex flex-col items-center justify-center p-5">
        <MeshBackground />
        <div className="z-10 bg-surface/60 backdrop-blur-md p-8 rounded-2xl border border-hairline text-center max-w-md">
          <h2 className="text-xl font-bold text-mist mb-4">Entreprise introuvable</h2>
          <p className="text-fog mb-6">{error || "Cette entreprise n'existe pas ou a été supprimée."}</p>
          <Link href="/entreprises" className="inline-flex items-center gap-2 text-cyan hover:underline">
            <ArrowLeft size={16} /> Retour à l'annuaire
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-afrika-mesh text-mist pb-20">
      <MeshBackground />
      
      <div className="relative mx-auto max-w-4xl px-5 py-8 sm:py-12">
        <Link href="/entreprises" className="inline-flex items-center gap-2 text-fog hover:text-cyan mb-8 transition-colors">
          <ArrowLeft size={16} /> Retour à l'annuaire
        </Link>

        {/* Header Profile */}
        <div className="rounded-3xl border border-hairline bg-surface/60 backdrop-blur-md overflow-hidden shadow-2xl mb-8">
          <div className="p-8 sm:p-12 relative flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 rounded-2xl border border-hairline overflow-hidden bg-surface-2 p-2 shadow-xl">
              <img 
                src={entreprise.logoUrl ? getImageUrl(entreprise.logoUrl) : logoUrl(entreprise.nom || entreprise.id)} 
                alt={`Logo de ${entreprise.nom}`} 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            
            <div className="text-center sm:text-left flex-1 w-full">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-mist mb-3">{entreprise.nom}</h1>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-xs sm:text-sm text-fog mb-6">
                {entreprise.secteur && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-surface-2">
                    <Briefcase size={14} className="text-cyan" /> 
                    {entreprise.secteur === 'AUTRE' ? entreprise.secteurPersonnalise : entreprise.secteur?.replace('_', ' ')}
                  </span>
                )}
                {entreprise.pays && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-surface-2">
                    <MapPin size={14} className="text-cyan" /> {entreprise.pays}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                <Link 
                  href="/connexion"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan to-brand text-ink font-semibold hover:opacity-90 transition-opacity"
                >
                  Voir les campagnes
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="rounded-2xl border border-hairline bg-surface/60 backdrop-blur-md p-6 sm:p-8">
              <h3 className="text-xl font-display font-semibold text-mist mb-4">À propos de l'entreprise</h3>
              {entreprise.description ? (
                <p className="text-fog leading-relaxed whitespace-pre-wrap">{entreprise.description}</p>
              ) : (
                <p className="text-fog italic">Cette entreprise n'a pas encore ajouté de description.</p>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl border border-hairline bg-surface/60 backdrop-blur-md p-6">
              <h3 className="text-lg font-display font-semibold text-mist mb-5">Contact & Infos</h3>
              <div className="space-y-4 text-sm text-fog">
                {entreprise.pays && (
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-cyan shrink-0 mt-0.5" />
                    <span>{entreprise.pays}</span>
                  </div>
                )}
                <div className="mt-6 pt-4 border-t border-hairline text-center">
                  <p className="text-xs mb-3">Pour contacter cette marque pour une collaboration :</p>
                  <Link href="/connexion" className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface border border-hairline rounded-lg text-mist transition-colors w-full justify-center">
                    <Mail size={16} /> Se connecter
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
