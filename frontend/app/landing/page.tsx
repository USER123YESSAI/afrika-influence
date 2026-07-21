'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Search, Wallet, MessageSquare, Sparkles, ShieldCheck,
  Star, MapPin,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { createurApi, NICHES_DISPONIBLES, RESEAUX, formatFCFA } from "@/lib/api";

const PAYS_OPTIONS = [
  { value: '', label: 'Tous les pays' },
  { value: 'SN', label: '🇸🇳 Sénégal' },
  { value: 'CI', label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'CM', label: '🇨🇲 Cameroun' },
  { value: 'ML', label: '🇲🇱 Mali' },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'GN', label: '🇬🇳 Guinée' },
];

const ETAPES = [
  {
    titre: "Publiez votre campagne",
    texte: "Décrivez votre objectif, votre budget en FCFA et les plateformes visées — en trois étapes guidées.",
  },
  {
    titre: "Recommandation & négociation",
    texte: "L'algorithme propose des créateurs compatibles avec votre budget et votre niche ; vous négociez chaque prestation ligne par ligne.",
  },
  {
    titre: "Livraison du contenu",
    texte: "Le créateur soumet chaque publication, que vous validez ou refusez avec un motif — rien n'est payé à l'aveugle.",
  },
  {
    titre: "Paiement automatique",
    texte: "Dès qu'une soumission est validée, le créateur est payé instantanément depuis votre portefeuille sécurisé.",
  },
];

const DIFFERENCIATEURS = [
  {
    icon: Wallet,
    titre: "Portefeuille sécurisé",
    texte: "Le budget est réservé à la publication de la campagne, jamais débité en dehors d'une collaboration validée.",
  },
  {
    icon: MessageSquare,
    titre: "Négociation transparente",
    texte: "Chaque prestation est négociée et acceptée ligne par ligne — aucune surprise sur le prix final.",
  },
  {
    icon: ShieldCheck,
    titre: "Paiement automatique",
    texte: "Le créateur est payé dès que son contenu est validé, sans action manuelle de la marque.",
  },
  {
    icon: Sparkles,
    titre: "Recommandation intelligente",
    texte: "Le matching croise budget, niche et plateformes — pas seulement le nombre d'abonnés.",
  },
];

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${BASE}${url}`;
};

const fmtAudience = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' :
  n >= 1000      ? (n / 1000).toFixed(0) + 'K' :
  String(n);

export default function Accueil() {
  const router = useRouter();
  const [createurs, setCreateurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [pays, setPays] = useState('');
  const [niche, setNiche] = useState('');
  const [reseau, setReseau] = useState('');

  useEffect(() => {
    createurApi.lister({}).then((data: any) => {
      setCreateurs(Array.isArray(data) ? data : []);
    }).catch(() => setCreateurs([])).finally(() => setLoading(false));
  }, []);

  const handleRecherche = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pays) params.set('pays', pays);
    if (niche) params.set('niche', niche);
    if (reseau) params.set('reseau', reseau);
    router.push(`/createurs${params.toString() ? `?${params}` : ''}`);
  };

  const totalAudience = (c: any) => {
    if (!c.reseaux) return c.audience || 0;
    return Object.values(c.reseaux as Record<string, any>).reduce((s: number, r: any) => s + (r?.audience || 0), 0);
  };

  const createursAffiches = createurs.slice(0, 6);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-brand-hero">
        <div className="relative mx-auto max-w-4xl px-5 pb-16 pt-24 text-center sm:pt-32">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-600">
            Créateurs × Marques · Afrique
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance font-display text-4xl font-semibold leading-tight text-brand-900 sm:text-5xl">
            Trouvez le bon créateur pour votre marque, où qu'il soit en Afrique.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-gray-600 sm:text-lg">
            Recherchez par plateforme, niche et pays, négociez directement le tarif ligne par
            ligne, et payez en toute sécurité une fois le contenu validé.
          </p>

          {/* Barre de recherche intégrée */}
          <form
            onSubmit={handleRecherche}
            className="mx-auto mt-10 flex max-w-2xl flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-soft sm:flex-row"
          >
            <select
              value={reseau}
              onChange={e => setReseau(e.target.value)}
              className="flex-1 rounded-xl border-0 bg-transparent px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="">Tous les réseaux</option>
              {RESEAUX.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={niche}
              onChange={e => setNiche(e.target.value)}
              className="flex-1 rounded-xl border-0 border-l border-gray-100 bg-transparent px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="">Toutes les niches</option>
              {NICHES_DISPONIBLES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select
              value={pays}
              onChange={e => setPays(e.target.value)}
              className="flex-1 rounded-xl border-0 border-l border-gray-100 bg-transparent px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {PAYS_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-brass-500 px-5 py-2.5 text-sm font-semibold text-brand-900 transition-colors hover:bg-brass-400"
            >
              <Search size={16} /> Rechercher
            </button>
          </form>

          <p className="mt-5 text-xs text-gray-500">
            {createurs.length > 0 ? `${createurs.length} créateurs` : 'Créateurs'} vérifiés ·
            Paiement sécurisé par portefeuille · {NICHES_DISPONIBLES.length} catégories
          </p>
        </div>
      </section>

      {/* BANDEAU DE COUVERTURE */}
      <section className="border-y border-gray-100 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4">
          {[
            { label: 'Créateurs sur la plateforme', valeur: String(createurs.length) },
            { label: 'Pays couverts', valeur: '10' },
            { label: 'Catégories de niches', valeur: String(NICHES_DISPONIBLES.length) },
            { label: 'Réseaux sociaux pris en charge', valeur: String(RESEAUX.length) },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-semibold text-brand-800">{stat.valeur}</p>
              <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
          Comment ça marche
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPES.map((etape, i) => (
            <div key={etape.titre}>
              <p className="font-mono text-xs text-brass-600">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-2 font-display text-lg text-brand-900">{etape.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{etape.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CRÉATEURS À LA UNE */}
      <section className="border-t border-gray-100 bg-stone-50">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">Créateurs à la une</h2>
            <Link href="/createurs" className="text-sm font-medium text-brand-700 hover:underline">
              Voir tous les créateurs →
            </Link>
          </div>

          {loading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <div key={i} className="h-56 animate-pulse rounded-2xl bg-white" />)}
            </div>
          ) : createursAffiches.length === 0 ? (
            <p className="mt-8 text-sm text-gray-400">Aucun créateur inscrit pour l'instant.</p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {createursAffiches.map((c) => (
                <Link
                  href={`/createurs/${c.id}`}
                  key={c.id}
                  className="group rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-brand-50">
                      {c.photoProfilUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getImageUrl(c.photoProfilUrl)} alt={c.nom} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-semibold text-brand-700">
                          {c.nom?.[0] ?? '?'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-brand-900 group-hover:text-brand-700">{c.nom}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400">
                        {c.pays && <MapPin size={11} />} {fmtAudience(totalAudience(c))} abonnés
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(c.niches ?? []).slice(0, 2).map((n: any) => (
                      <span key={n.niche} className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700">
                        {n.niche}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3 text-sm">
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
      </section>

      {/* POURQUOI AFRIKA INFLUENCE HUB */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
          Pourquoi Afrika Influence Hub
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DIFFERENCIATEURS.map(({ icon: Icon, titre, texte }) => (
            <div key={titre} className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                <Icon className="text-brand-700" size={20} />
              </div>
              <h3 className="mt-4 font-display text-base text-brand-900">{titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATÉGORIES */}
      <section className="border-t border-gray-100 bg-stone-50">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
            Parcourir par catégorie
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {NICHES_DISPONIBLES.map(n => (
              <Link
                key={n}
                href={`/createurs?niche=${encodeURIComponent(n)}`}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                {n}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL — deux chemins */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-gradient-brand p-8 text-white">
            <h3 className="font-display text-xl">Vous êtes une marque ou un particulier</h3>
            <p className="mt-2 text-sm text-brand-100">
              Publiez une campagne, recevez des recommandations de créateurs et lancez votre première collaboration.
            </p>
            <Link
              href="/inscription?role=ENTREPRISE"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brass-500 px-5 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brass-400"
            >
              Trouver des créateurs <ArrowRight size={16} />
            </Link>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <h3 className="font-display text-xl text-brand-900">Vous êtes créateur de contenu</h3>
            <p className="mt-2 text-sm text-gray-500">
              Créez votre profil, ajoutez vos offres et soyez recommandé aux marques qui correspondent à votre audience.
            </p>
            <Link
              href="/inscription?role=CREATEUR"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-700 px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              Devenir créateur <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
