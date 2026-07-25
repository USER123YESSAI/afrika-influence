'use client';
import { useEffect, useState } from 'react';

const SLIDES = [
  {
    title: 'Créateur & contenu',
    subtitle: 'Studio & créativité',
    description: 'Visuels de créateurs, coulisses et contenus inspirants.',
    highlight: 'Talents créatifs',
    badge: 'Créateurs',
    accent: 'from-violet-500 to-fuchsia-500',
image: '/images/afrika-content.jpg',
  },
  {
    title: 'Collaborations marque',
    subtitle: 'Partenariats stratégiques',
    description: 'Images de réunions, briefings et lancements de campagnes.',
    highlight: 'Partenariats durables',
    badge: 'Marques',
    accent: 'from-sky-500 to-cyan-500',
    image: 'https://picsum.photos/800/1000?random=2',
  },
  {
    title: 'Influence & réseaux sociaux',
    subtitle: 'Engagement digital',
    description: 'Scènes d’influenceurs et contenus sociaux performants.',
    highlight: 'Reach amplifié',
    badge: 'Réseaux',
    accent: 'from-amber-500 to-orange-500',
    image: 'https://picsum.photos/800/1000?random=3',
  },
  {
    title: 'Analyse & dashboards',
    subtitle: 'Données et KPIs',
    description: 'Tableaux de bord et rapports pour suivre la performance.',
    highlight: 'Décisions data-driven',
    badge: 'Analytics',
    accent: 'from-brand-500 to-teal-500',
    image: 'https://picsum.photos/800/1000?random=4',
  },
  {
    title: 'Paiements & e-commerce',
    subtitle: 'Transactions sécurisées',
    description: 'Flux de paiement et conversion pour les campagnes commerciales.',
    highlight: 'Paiements fluides',
    badge: 'Paiements',
    accent: 'from-violet-500 to-fuchsia-500',
    image: 'https://picsum.photos/800/1000?random=5',
  },
  {
    title: 'Communauté & équipes',
    subtitle: 'Réseau humain',
    description: 'Rencontres, événements et équipes qui font vivre la plateforme.',
    highlight: 'Communauté active',
    badge: 'Communauté',
    accent: 'from-sky-500 to-cyan-500',
    image: 'https://picsum.photos/800/1000?random=6',
  },
  {
    title: 'Visuel abstrait',
    subtitle: 'Ambiance & couleurs',
    description: 'Visuels graphiques pour renforcer l’identité visuelle.',
    highlight: 'Design vibrant',
    badge: 'Visuel',
    accent: 'from-amber-500 to-orange-500',
    image: 'https://picsum.photos/800/1000?random=7',
  },
];
export function PlatformCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length);
    }, 5200);
    return () => window.clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => setActiveIndex(index);
  const goNext = () => setActiveIndex((current) => (current + 1) % SLIDES.length);
  const goPrev = () => setActiveIndex((current) => (current - 1 + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[activeIndex];
  const transformClasses = [
    'translate-x-0',
    '-translate-x-full',
    '-translate-x-[200%]',
    '-translate-x-[300%]',
    '-translate-x-[400%]',
    '-translate-x-[500%]',
    '-translate-x-[600%]',
    '-translate-x-[700%]',
  ];
  const slideTransformClass = transformClasses[activeIndex] ?? 'translate-x-0';

  return (
    <div className="relative h-full min-h-[480px] overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-xl shadow-slate-900/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.25),_transparent_30%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_35%)]" />
      <div className="relative h-full overflow-hidden">
        <div className={`flex h-full transition-transform duration-700 ease-out ${slideTransformClass}`}>
          {SLIDES.map((item) => (
            <div key={item.title} className="min-h-[480px] min-w-full px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
              <div className="grid h-full gap-8 lg:grid-cols-[0.95fr_0.85fr] lg:items-center">
                <div className="space-y-6">
                  <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-100 font-semibold">
                    {item.badge}
                  </span>
                  <div className="space-y-4">
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-300">{item.subtitle}</p>
                    <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white leading-tight">
                      {item.title}
                    </h2>
                    <p className="max-w-2xl text-base leading-7 text-slate-200">
                      {item.description}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/10 backdrop-blur-sm">
                    <p className="text-sm text-slate-200">{item.highlight}</p>
                    <div className={`mt-3 h-2 rounded-full bg-gradient-to-r ${item.accent}`} />
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-4 rounded-[32px] bg-white/5 blur-2xl" />
                  <div className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/40">
                    <div className="aspect-[4/5] bg-gradient-to-br from-white/10 to-white/5 p-6">
                      <div className="h-full rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_45%)] p-5">
                        <div className="space-y-4">
                          <div className="h-10 w-32 rounded-full bg-white/10" />
                          <div className="grid gap-4">
                            <div className="h-40 rounded-[28px] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-4 text-white shadow-inner shadow-slate-950/10">
                              <div className="h-full rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),transparent_40%)] p-4">
                                <div className="mb-3 flex items-center gap-2">
                                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-xl">🌍</span>
                                  <span className="text-sm uppercase tracking-[0.24em] text-slate-300">Afrique</span>
                                </div>
                                <div className="mt-6 h-28 rounded-3xl overflow-hidden">
                                  {item.image && (
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                              <div className="space-y-2 rounded-3xl bg-white/5 p-3">
                                <div className="h-3 rounded-full bg-slate-700" />
                                <div className="h-3 rounded-full bg-slate-700 w-4/5" />
                              </div>
                              <div className="space-y-2 rounded-3xl bg-white/5 p-3">
                                <div className="h-3 rounded-full bg-slate-700" />
                                <div className="h-3 rounded-full bg-slate-700 w-3/5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center gap-3">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Voir la diapositive ${index + 1}`}
            onClick={() => goToSlide(index)}
            className={`pointer-events-auto h-2.5 w-8 rounded-full transition-all ${activeIndex === index ? 'bg-white' : 'bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={goPrev}
        className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-slate-950/70 p-3 text-white shadow-lg shadow-slate-950/30 transition hover:bg-slate-950"
        aria-label="Diapositive précédente"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={goNext}
        className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-slate-950/70 p-3 text-white shadow-lg shadow-slate-950/30 transition hover:bg-slate-950"
        aria-label="Diapositive suivante"
      >
        ›
      </button>
    </div>
  );
}
