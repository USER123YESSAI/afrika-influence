'use client';
import Link from 'next/link';
import RetourNav from '@/components/nav/RetourNav';


const OPTIONS = [
  {
    href: '/inscription/createur',
    title: 'Créateur',
    subtitle: 'Rejoignez des campagnes et proposez votre créativité aux marques.',
    accent: 'bg-purple-50',
    border: 'border-purple-100',
  },
  {
    href: '/inscription/marque',
    title: 'Marque',
    subtitle: 'Créez et pilotez vos campagnes d’influence en Afrique.',
    accent: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
];

export default function InscriptionChoixPage() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-16 lg:grid-cols-[1.1fr_minmax(360px,0.9fr)] lg:px-8">
        <div className="space-y-8">
          <RetourNav theme="dark" />
          <div className="max-w-2xl">
            <span className="badge bg-cyan/20 text-cyan">Rejoindre Afrika Influence</span>
            <h1 className="font-display text-5xl text-mist mt-6 mb-4">Choisissez votre espace</h1>
            <p className="text-fog text-lg leading-relaxed">
              Que vous soyez créateur ou marque, démarrez avec un espace personnalisé, des outils dédiés et des campagnes plus impactantes.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {OPTIONS.map((option) => (
              <Link key={option.href} href={option.href}
                className={`group block rounded-[28px] border border-hairline bg-surface p-8 transition-all shadow-card hover:-translate-y-1 hover:shadow-bento hover:border-cyan`}>
                <h2 className="text-xl font-semibold text-mist mb-3">{option.title}</h2>
                <p className="text-sm text-fog leading-relaxed mb-6">{option.subtitle}</p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan">
                  Commencer <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>

          <p className="text-sm text-fog">
            Déjà inscrit ? <Link href="/connexion" className="text-cyan font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>

        <div className="hidden lg:flex flex-1 items-stretch px-6 py-6">
          <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-soft">
            <img 
              src="/images/afrika-content.jpg" 
              alt="Afrika Influence" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay masquant la partie basse "Afrika Nova" */}
            <div className="absolute bottom-0 left-0 w-full h-[45%] bg-[#064e3b] p-10 flex flex-col justify-end">
              {/* Dégradé de transition vers les photos du haut */}
              <div className="absolute top-0 left-0 w-full h-32 -translate-y-full bg-gradient-to-t from-[#064e3b] to-transparent"></div>
              
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium mb-4 border border-white/20 backdrop-blur-md">
                  Rejoignez le mouvement
                </span>
                <h2 className="text-3xl font-display text-white leading-tight mb-3">
                  L'influence en <span className="text-emerald-300">Afrique</span>
                </h2>
                <p className="text-emerald-50/90 text-sm leading-relaxed mb-6 max-w-sm">
                  Connectez-vous avec les meilleurs créateurs de contenu et les marques les plus prestigieuses.
                </p>
               
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
