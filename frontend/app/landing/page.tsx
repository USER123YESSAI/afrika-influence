'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Search, Wallet, MessageSquare, Sparkles, ShieldCheck,
  Star, MapPin,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import Reveal from "@/components/ui/Reveal";
import { createurApi, NICHES_DISPONIBLES, RESEAUX, formatFCFA } from "@/lib/api";
import CreateursPage from "../createurs/page";
import EntreprisesPage from "../entreprises/page";

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
    titre: "Publier",
    long: "Publier votre campagne",
    texte: "Décrivez votre objectif, votre budget en FCFA et les plateformes visées — en trois étapes guidées.",
    points: ["Budget réservé à la publication", "Plateformes et niches ciblées"],
  },
  {
    titre: "Négocier",
    long: "Recommandation & négociation",
    texte: "L'algorithme propose des créateurs compatibles avec votre budget ; vous négociez chaque prestation ligne par ligne.",
    points: ["Score de compatibilité par créateur", "Prix accepté ligne par ligne"],
  },
  {
    titre: "Livrer",
    long: "Livraison du contenu",
    texte: "Le créateur soumet chaque publication, que vous validez ou refusez avec un motif — rien n'est payé à l'aveugle.",
    points: ["Soumission unité par unité", "Refus motivé si besoin"],
  },
  {
    titre: "Payer",
    long: "Paiement automatique",
    texte: "Dès qu'une soumission est validée, le créateur est payé instantanément depuis votre portefeuille sécurisé.",
    points: ["Aucune action manuelle", "Facture générée automatiquement"],
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
  const [etapeActive, setEtapeActive] = useState(0);

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
  // Le défilement en boucle n'a de sens qu'avec assez de créateurs distincts —
  // sinon la répétition est immédiatement visible. En dessous du seuil, on
  // affiche une simple rangée statique, sans dupliquer les mêmes profils.
  const SEUIL_DEFILEMENT = 6;
  const defilementActif = createurs.length >= SEUIL_DEFILEMENT;
  const marqueeItems = defilementActif ? [...createurs, ...createurs] : createurs;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-stone-50">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-5 pb-14 pt-28 text-center sm:pt-32">
          <p className="hero-in font-eyebrow text-xs font-semibold uppercase tracking-[0.28em] text-brass-600">
            Créateurs × Marques · Afrique
          </p>
          <h1
            className="hero-in mx-auto mt-6 max-w-3xl text-balance font-display text-5xl font-medium leading-[1.05] text-brand-900 sm:text-7xl"
            style={{ animationDelay: '90ms' }}
          >
            L'influence africaine,<br />
            <span className="italic text-brass-600">une ligne à la fois.</span>
          </h1>
          <p
            className="hero-in mx-auto mt-7 max-w-xl text-base text-gray-600 sm:text-lg"
            style={{ animationDelay: '180ms' }}
          >
            Recherchez par plateforme, niche et pays, négociez directement le tarif de chaque
            prestation, et payez en toute sécurité une fois le contenu validé.
          </p>

          {/* Barre de recherche intégrée */}
          <form
            onSubmit={handleRecherche}
            className="hero-in mx-auto mt-10 flex max-w-2xl flex-col gap-1.5 rounded-2xl bg-brand-900 p-1.5 shadow-soft sm:flex-row"
            style={{ animationDelay: '280ms' }}
          >
            <select
              value={reseau}
              onChange={e => setReseau(e.target.value)}
              className="flex-1 rounded-xl border-0 bg-transparent px-3.5 py-3 text-sm text-brand-50 focus:outline-none focus:ring-2 focus:ring-brass-400 [&>option]:text-gray-900"
            >
              <option value="">Tous les réseaux</option>
              {RESEAUX.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={niche}
              onChange={e => setNiche(e.target.value)}
              className="flex-1 rounded-xl border-0 border-l border-white/10 bg-transparent px-3.5 py-3 text-sm text-brand-50 focus:outline-none focus:ring-2 focus:ring-brass-400 [&>option]:text-gray-900"
            >
              <option value="">Toutes les niches</option>
              {NICHES_DISPONIBLES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select
              value={pays}
              onChange={e => setPays(e.target.value)}
              className="flex-1 rounded-xl border-0 border-l border-white/10 bg-transparent px-3.5 py-3 text-sm text-brand-50 focus:outline-none focus:ring-2 focus:ring-brass-400 [&>option]:text-gray-900"
            >
              {PAYS_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-brass-500 px-6 py-3 text-sm font-semibold text-brand-900 transition-colors hover:bg-brass-400"
            >
              <Search size={16} /> Rechercher
            </button>
          </form>
        </div>

        {/* Bandeau créateurs — défilement continu si assez de profils, sinon rangée statique */}
        {marqueeItems.length > 0 && (
          <div className="relative border-t border-gray-100 bg-white py-10">
            <div className="mb-6 flex items-center justify-center gap-2 px-5 text-xs text-gray-400">
              <span className="font-medium text-brand-800">{createurs.length} créateurs</span> vérifiés
              <span aria-hidden>·</span> 10 pays couverts
              <span aria-hidden>·</span> {NICHES_DISPONIBLES.length} catégories
            </div>
            <div className={`hide-scrollbar ${defilementActif ? 'overflow-hidden' : 'overflow-x-auto'}`}>
              <div className={`${defilementActif ? 'marquee-row' : 'flex justify-center'} gap-4 px-4`}>
                {marqueeItems.map((c, i) => (
                  <Link
                    href={`/createurs/${c.id}`}
                    key={`${c.id}-${i}`}
                    className="group flex w-64 shrink-0 items-center gap-3 rounded-2xl border border-gray-100 bg-stone-50 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50"
                  >
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-white">
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
                      <p className="truncate text-sm font-medium text-brand-900">{c.nom}</p>
                      <p className="truncate text-xs text-gray-400">
                        {c.niches?.[0]?.niche ?? 'Créateur'} · {fmtAudience(totalAudience(c))}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* COMMENT ÇA MARCHE — onglets, contenu qui change */}
      <section id="comment-ca-marche" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <h2 className="font-display text-3xl font-medium text-brand-900">Tout le parcours, une seule plateforme</h2>
        </Reveal>

        {/* Onglets */}
        <Reveal delay={80}>
          <div className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-stone-50 p-2">
            {ETAPES.map((etape, i) => (
              <button
                key={etape.titre}
                type="button"
                onClick={() => setEtapeActive(i)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  etapeActive === i
                    ? 'bg-brand-900 text-white shadow-soft'
                    : 'text-gray-500 hover:bg-white hover:text-brand-800'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] ${
                    etapeActive === i ? 'bg-brass-500 text-brand-900' : 'bg-white text-gray-400'
                  }`}
                >
                  {i + 1}
                </span>
                {etape.titre}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Panneau de contenu */}
        <Reveal delay={140}>
          <div className="mt-6 grid gap-8 rounded-3xl border border-gray-100 bg-white p-8 sm:p-10 lg:grid-cols-2 lg:items-center">
            <div key={`texte-${etapeActive}`} className="step-fade">
              <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.2em] text-brass-600">
                Étape {etapeActive + 1} / {ETAPES.length}
              </p>
              <h3 className="mt-3 font-display text-2xl text-brand-900">{ETAPES[etapeActive].long}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">{ETAPES[etapeActive].texte}</p>
              <ul className="mt-5 space-y-2">
                {ETAPES[etapeActive].points.map(pt => (
                  <li key={pt} className="flex items-center gap-2 text-sm text-brand-800">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brass-500" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            <div key={`visuel-${etapeActive}`} className="step-fade">
              {etapeActive === 0 && (
                <div className="rounded-2xl bg-stone-50 p-6">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Budget</span>
                    <span className="font-mono font-medium text-brand-900">500 000 FCFA</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {['Instagram', 'TikTok', 'YouTube'].map(p => (
                      <span key={p} className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] text-brand-700">{p}</span>
                    ))}
                  </div>
                  <div className="mt-5 h-1.5 w-full rounded-full bg-gray-100">
                    <div className="h-1.5 w-1/3 rounded-full bg-brass-500" />
                  </div>
                  <p className="mt-2 text-[11px] text-gray-400">Étape 1 sur 3 · Informations générales</p>
                </div>
              )}
              {etapeActive === 1 && (
                <div className="space-y-3 rounded-2xl bg-stone-50 p-6">
                  <div className="flex items-center justify-between rounded-xl bg-white p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-brand-100" />
                      <div>
                        <p className="text-xs font-medium text-brand-900">Aminata Diallo</p>
                        <p className="text-[11px] text-gray-400">Mode · 45K abonnés</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-brass-100 px-2.5 py-1 text-[11px] font-semibold text-brass-700">92% compatible</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-dashed border-gray-200 p-3 text-xs">
                    <span className="text-gray-500">2 × Reel Instagram</span>
                    <span className="font-mono font-semibold text-brand-900">30 000 FCFA</span>
                  </div>
                </div>
              )}
              {etapeActive === 2 && (
                <div className="rounded-2xl bg-stone-50 p-6">
                  <div className="flex items-center gap-3 rounded-xl bg-white p-3">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-brand-100" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-brand-900">Unité 1/2 soumise</p>
                      <p className="text-[11px] text-gray-400">En attente de validation</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-[11px] text-gray-500">Refuser</span>
                    <span className="flex-1 rounded-lg bg-brand-900 py-2 text-center text-[11px] font-medium text-white">Valider</span>
                  </div>
                </div>
              )}
              {etapeActive === 3 && (
                <div className="rounded-2xl bg-gradient-brand p-6 text-white">
                  <p className="text-[11px] uppercase tracking-wide text-brand-200">Paiement confirmé</p>
                  <p className="mt-1.5 font-display text-3xl">30 000 FCFA</p>
                  <p className="mt-2 text-[11px] text-brand-200">Versé automatiquement à Aminata Diallo</p>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {/* CRÉATEURS À LA UNE */}
      <section className="border-t border-gray-100 bg-stone-50">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Reveal>
            <div className="flex items-end justify-between">
              <h2 className="font-display text-3xl font-medium text-brand-900">Créateurs à la une</h2>
              <Link href="/createurs" className="group flex items-center gap-1 text-sm font-medium text-brand-700">
                Voir tous les créateurs
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>

          {loading ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <div key={i} className="h-56 animate-pulse rounded-2xl bg-white" />)}
            </div>
          ) : createursAffiches.length === 0 ? (
            <p className="mt-10 text-sm text-gray-400">Aucun créateur inscrit pour l'instant.</p>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {createursAffiches.map((c, i) => (
                <Reveal key={c.id} delay={(i % 3) * 100}>
                  <Link
                    href={`/createurs/${c.id}`}
                    className="group block rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
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
                        <p className="truncate font-medium text-brand-900 transition-colors group-hover:text-brand-700">{c.nom}</p>
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
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* POURQUOI AFRIKA INFLUENCE HUB — un différenciateur en avant, trois en soutien */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <h2 className="font-display text-3xl font-medium text-brand-900">Pourquoi Afrika Influence Hub</h2>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <div className="flex h-full flex-col justify-between rounded-2xl bg-gradient-brand p-8 text-white">
              <div>
                <ShieldCheck className="text-brass-400" size={26} />
                <h3 className="mt-5 font-display text-2xl">Paiement automatique, dès validation</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-100">
                  Aucune action manuelle de la marque : dès qu'une soumission est validée, le
                  créateur est payé instantanément depuis le portefeuille sécurisé de la campagne.
                </p>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-5">
            {[
              { icon: Wallet, titre: "Portefeuille sécurisé", texte: "Le budget est réservé à la publication, jamais débité hors d'une collaboration validée." },
              { icon: MessageSquare, titre: "Négociation transparente", texte: "Chaque prestation est négociée et acceptée ligne par ligne." },
            ].map(({ icon: Icon, titre, texte }, i) => (
              <Reveal key={titre} delay={(i + 1) * 120}>
                <div className="rounded-2xl border border-gray-100 bg-white p-6">
                  <Icon className="text-brand-700" size={20} />
                  <h3 className="mt-3 font-display text-base text-brand-900">{titre}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{texte}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={360} className="mt-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:flex sm:items-center sm:gap-4">
            <Sparkles className="shrink-0 text-brass-600" size={22} />
            <div className="mt-3 sm:mt-0">
              <h3 className="font-display text-base text-brand-900">Recommandation intelligente</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Le matching croise budget, niche et plateformes — pas seulement le nombre d'abonnés.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CATÉGORIES */}
      <section className="border-t border-gray-100 bg-stone-50">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Reveal>
            <h2 className="font-display text-3xl font-medium text-brand-900">Parcourir par catégorie</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-10 flex flex-wrap gap-3">
              {NICHES_DISPONIBLES.map(n => (
                <Link
                  key={n}
                  href={`/createurs?niche=${encodeURIComponent(n)}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700"
                >
                  {n}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ANNUAIRE PUBLIC — CRÉATEURS (embarqué) */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-5 text-center mb-6">
          <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
            Découvrez nos créateurs
          </h2>
          <p className="mt-3 text-sm text-gray-500 max-w-xl mx-auto">
            Recherchez et filtrez les talents pour trouver la voix parfaite pour votre prochaine campagne.
          </p>
        </div>
        <CreateursPage embedded={true} />
      </section>

      {/* ANNUAIRE PUBLIC — ENTREPRISES (embarqué) */}
      <section className="border-t border-gray-100 bg-stone-50 py-16">
        <div className="mx-auto max-w-6xl px-5 text-center mb-6">
          <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
            Découvrez nos marques
          </h2>
          <p className="mt-3 text-sm text-gray-500 max-w-xl mx-auto">
            Explorez les entreprises qui font confiance à notre plateforme pour leurs campagnes d'influence.
          </p>
        </div>
        <EntreprisesPage embedded={true} />
      </section>

      {/* CTA FINAL — deux chemins */}
      <section className="mx-auto max-w-5xl px-5 py-24">
        <div className="grid gap-4 sm:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-2xl bg-gradient-brand p-8 text-white">
              <h3 className="font-display text-xl">Vous êtes une marque ou un particulier</h3>
              <p className="mt-2 text-sm text-brand-100">
                Publiez une campagne, recevez des recommandations de créateurs et lancez votre première collaboration.
              </p>
              <Link
                href="/inscription?role=ENTREPRISE"
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-brass-500 px-5 py-2.5 text-sm font-semibold text-brand-900 transition-colors hover:bg-brass-400"
              >
                Trouver des créateurs <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-8">
              <h3 className="font-display text-xl text-brand-900">Vous êtes créateur de contenu</h3>
              <p className="mt-2 text-sm text-gray-500">
                Créez votre profil, ajoutez vos offres et soyez recommandé aux marques qui correspondent à votre audience.
              </p>
              <Link
                href="/inscription?role=CREATEUR"
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-brand-700 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
              >
                Devenir créateur <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
