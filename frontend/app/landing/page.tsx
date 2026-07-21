'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Shield, TrendingUp } from "lucide-react";
import { MeshBackground } from "@/components/layout/MeshBackground";
import { createurApi, getEntreprisesPubliques } from "@/lib/api";
import CreateursPage from "../createurs/page";
import EntreprisesPage from "../entreprises/page";

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

      {/* ANNUAIRE PUBLIC — CRÉATEURS (embarqué) */}
      <section className="bg-ink border-t border-hairline py-16">
        <div className="mx-auto max-w-6xl px-5 text-center mb-6">
          <h2 className="font-display text-2xl font-semibold text-mist sm:text-3xl">
            Découvrez nos Créateurs
          </h2>
          <p className="mt-3 text-sm text-fog max-w-xl mx-auto">
            Recherchez et filtrez les talents pour trouver la voix parfaite pour votre prochaine campagne.
          </p>
        </div>
        <CreateursPage embedded={true} />
      </section>

      {/* ANNUAIRE PUBLIC — ENTREPRISES (embarqué) */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-5 text-center mb-6">
          <h2 className="font-display text-2xl font-semibold text-mist sm:text-3xl">
            Découvrez nos Marques
          </h2>
          <p className="mt-3 text-sm text-fog max-w-xl mx-auto">
            Explorez les entreprises qui font confiance à notre plateforme pour leurs campagnes d'influence.
          </p>
        </div>
        <EntreprisesPage embedded={true} />
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