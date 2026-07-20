'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Shield, TrendingUp } from "lucide-react";
import { MeshBackground } from "@/components/layout/MeshBackground";
import { createurApi, getEntreprisesPubliques } from "@/lib/api";

const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0b1114,101a1e&radius=0`;

const logoUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0b1114`;

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${BASE}${url}`;
};

const CREATEURS_APERCU = [
  { nom: "Moussa D.", niche: "Tech & Gadgets", plateforme: "YouTube · 120K", seed: "MoussaD" },
  { nom: "Fatou N.", niche: "Cuisine", plateforme: "TikTok · 210K", seed: "FatouN" },
  { nom: "Ibrahim S.", niche: "Éducation", plateforme: "Instagram · 45K", seed: "IbrahimS" },
  { nom: "Adjoa M.", niche: "Beauté", plateforme: "TikTok · 95K", seed: "AdjoaM" },
  { nom: "Aïssatou K.", niche: "Mode & Lifestyle", plateforme: "Instagram · 84K", seed: "AissatouK" },
];

const ENTREPRISES_APERCU = [
  { nom: "Teranga Foods", secteur: "Agroalimentaire", campagnes: "12 campagnes", seed: "TerangaFoods" },
  { nom: "Sunu Tech", secteur: "Technologie", campagnes: "8 campagnes", seed: "SunuTech" },
  { nom: "Baobab Cosmetics", secteur: "Beauté", campagnes: "20 campagnes", seed: "BaobabCosmetics" },
  { nom: "Waxi Wear", secteur: "Mode", campagnes: "15 campagnes", seed: "WaxiWear" },
];

const AVANTAGES = [
  {
    icon: Sparkles,
    titre: "Matching intelligent",
    texte: "Des recommandations de créateurs alignées avec vos objectifs de campagne, pas juste des followers.",
  },
  {
    icon: Shield,
    titre: "Collaborations encadrées",
    texte: "Suivi de chaque étape, du brief à la livraison, avec paiements sécurisés et litiges arbitrés.",
  },
  {
    icon: TrendingUp,
    titre: "Croissance mesurable",
    texte: "Un tableau de bord clair sur vos revenus, vos campagnes en cours et votre progression.",
  },
];

export default function Accueil() {
  const [createurs, setCreateurs] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      createurApi.lister({}).catch(() => []),
      getEntreprisesPubliques({}).catch(() => [])
    ]).then(([createursData, entreprisesData]) => {
      setCreateurs(Array.isArray(createursData) ? createursData.slice(0, 8) : []);
      setEntreprises(Array.isArray(entreprisesData) ? entreprisesData.slice(0, 4) : []);
      setLoading(false);
    });
  }, []);

  const getReseaux = (c: any) => {
    if (!c.reseaux) return "-";
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

  const fmt = (n: number) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' :
    n >= 1000      ? (n / 1000).toFixed(0) + 'K' :
    String(n);

  const displayCreateurs = createurs.length > 0 ? createurs : CREATEURS_APERCU.map(c => ({...c, isStatic: true}));
  const displayEntreprises = entreprises.length > 0 ? entreprises : ENTREPRISES_APERCU.map(e => ({...e, isStatic: true}));

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-afrika-mesh">
        <MeshBackground />
        <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-24 text-center sm:pt-32">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
            Créateurs × Marques
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-semibold leading-tight text-mist sm:text-6xl">
            L&apos;influence africaine,{" "}
            <span className="text-gradient-afrika">connectée</span> aux marques qui comptent.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-fog sm:text-lg">
            Afrika Influence Hub met en relation créateurs de contenu et entreprises pour des
            campagnes authentiques — du premier message au paiement final.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/inscription?role=CREATEUR"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan to-emerald px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
            >
              Devenir créateur <ArrowRight size={16} />
            </Link>
            <Link
              href="/inscription?role=ENTREPRISE"
              className="rounded-full border border-hairline px-6 py-3 text-sm font-semibold text-mist transition-colors hover:border-cyan"
            >
              Trouver des créateurs
            </Link>
          </div>
        </div>

        {/* Bandeau défilant : aperçu créateurs — cartes agrandies, photo en fond */}
        <div className="relative border-t border-hairline bg-surface/60 py-8">
        <h2 className="font-display text-2xl font-semibold text-mist sm:text-3xl">Créateurs</h2>
          <div className="flex overflow-hidden">
            <div className="marquee-track flex shrink-0 gap-5 pr-5">
              {displayCreateurs.map((c, i) => (
                <Link
                  href={c.isStatic ? "#" : `/createurs/${c.id}`}
                  key={i}
                  className="group relative h-72 w-56 shrink-0 overflow-hidden rounded-2xl border border-hairline hover:border-cyan/50 transition-all hover:shadow-[0_0_30px_-5px_rgba(45,212,191,0.15)] hover:-translate-y-1 block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.isStatic ? avatarUrl(c.seed) : (c.photoProfilUrl ? getImageUrl(c.photoProfilUrl) : avatarUrl(c.nom || c.id))}
                    alt={`Photo de profil de ${c.nom}`}
                    className="absolute inset-0 h-full w-full scale-125 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                    <p className="font-display text-base text-white line-clamp-1">{c.nom}</p>
                    <p className="mt-1 font-mono text-[11px] text-cyan-400 line-clamp-1">
                      {c.isStatic ? c.niche : (c.niches && c.niches.length > 0 ? c.niches[0].niche : "Créateur")}
                    </p>
                    <p className="font-mono text-[11px] text-gray-300 line-clamp-1">
                      {c.isStatic ? c.plateforme : getReseaux(c)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section id="avantages" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-2xl font-semibold text-mist sm:text-3xl">
          Pourquoi Afrika Influence Hub
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {AVANTAGES.map(({ icon: Icon, titre, texte }) => (
            <div key={titre} className="rounded-2xl border border-hairline bg-surface p-6">
              <Icon className="text-cyan" size={22} />
              <h3 className="mt-4 font-display text-lg text-mist">{titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fog">{texte}</p>
            </div>
          ))}
        </div>
      </section>

    
      {/* ANNUAIRE PUBLIC — CRÉATEURS (aperçu verrouillé) */}
     

      {/* ANNUAIRE PUBLIC — ENTREPRISES (aperçu) */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-mist sm:text-3xl">Entreprises</h2>
          <Link href="/connexion" className="text-sm text-cyan hover:underline">
            Voir toutes les entreprises →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayEntreprises.map((e, i) => (
            <Link 
              href={e.isStatic ? "#" : `/entreprises/${e.id}`}
              key={i} 
              className="group flex flex-col items-center text-center rounded-2xl border border-hairline bg-surface p-6 hover:border-cyan/50 transition-all hover:shadow-[0_0_30px_-5px_rgba(45,212,191,0.15)] hover:-translate-y-1 block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-hairline bg-surface-2 p-2 shadow-sm mb-4">
                <img
                  src={e.isStatic ? logoUrl(e.seed) : (e.logoUrl ? getImageUrl(e.logoUrl) : logoUrl(e.nom || e.id))}
                  alt={`Logo de ${e.nom}`}
                  className="h-full w-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <p className="text-lg font-semibold text-mist line-clamp-1 group-hover:text-cyan transition-colors">{e.nom}</p>
              <p className="mt-1 text-sm text-fog line-clamp-1">
                {e.isStatic ? e.secteur : (e.secteur === 'AUTRE' ? e.secteurPersonnalise : e.secteur?.replace('_', ' ') || 'Non spécifié')}
              </p>
              <p className="mt-3 font-mono text-[11px] text-cyan px-3 py-1 rounded-full border border-hairline bg-surface-2">
                {e.isStatic ? e.campagnes : `${e.nombreCampagnes || 0} campagne${e.nombreCampagnes !== 1 ? 's' : ''}`}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-hairline bg-surface">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <h2 className="font-display text-2xl font-semibold text-mist sm:text-3xl">
            Prêt à faire partie du réseau ?
          </h2>
          <p className="mt-3 text-sm text-fog">
            Inscription gratuite en 2 minutes, complétez votre profil à votre rythme.
          </p>
          <Link
            href="/inscription"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan to-emerald px-6 py-3 text-sm font-semibold text-ink"
          >
            Créer mon compte <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}