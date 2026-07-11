'use client';
import Link from 'next/link';


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

<div className="p-6 rounded-[32px] bg-surface shadow-card border border-hairline">
  <h2 className="text-base font-semibold text-mist mb-3">
    Conditions d'utilisation
  </h2>

  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      name="acceptTerms"
      required
      className="mt-1 h-5 w-5 rounded border-hairline bg-surface-2 text-cyan focus:ring-cyan"
    />

    <span className="text-sm text-fog leading-relaxed">
      J'ai lu et j'accepte les{" "}
      <a
        href="/conditions-utilisation"
        className="text-cyan font-medium hover:underline"
      >
        Conditions d'utilisation
      </a>{" "}
      ainsi que la{" "}
      <a
        href="/politique-confidentialite"
        className="text-cyan font-medium hover:underline"
      >
        Politique de confidentialité
      </a>
      .
    </span>
  </label>
</div>

          <p className="text-sm text-fog">
            Déjà inscrit ? <Link href="/connexion" className="text-cyan font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>

        <div className="hidden lg:flex flex-1 items-stretch px-6 py-6">
          <img 
            src="/images/afrika-content.jpg" 
            alt="Afrika Influence" 
            className="w-full h-full object-cover rounded-3xl shadow-soft"
          />
        </div>
      </div>
    </div>
  );
}
