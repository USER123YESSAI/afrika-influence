'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';

/**
 * Barre de navigation "Page précédente / Page suivante / Accueil", utilisée
 * sur les pages publiques (connexion, inscription) pour permettre à
 * l'utilisateur de sortir du tunnel d'authentification sans utiliser
 * uniquement les boutons du navigateur.
 *
 * Le bouton "Page suivante" existe pour le cas où quelqu'un clique sur
 * "Page précédente" pour vérifier un détail ailleurs (ex : relire les
 * conditions d'utilisation, comparer avec l'offre créateur) puis veut
 * reprendre exactement où il en était : les pages d'inscription persistent
 * leur brouillon (étape + champs, hors mot de passe) le temps de la session
 * via sessionStorage, donc revenir en avant ou en arrière ne fait jamais
 * perdre la progression.
 */
export default function RetourNav({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const router = useRouter();

  const styles = theme === 'dark'
    ? {
        pill: 'bg-surface/70 border-hairline',
        text: 'text-fog',
        hover: 'hover:text-cyan hover:bg-cyan/10',
        sep: 'bg-hairline',
      }
    : {
        pill: 'bg-gray-50 border-gray-100',
        text: 'text-gray-500',
        hover: 'hover:text-brand-600 hover:bg-brand-50',
        sep: 'bg-gray-200',
      };

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border ${styles.pill} p-1 mb-8 text-sm`}>
      <button
        type="button"
        onClick={() => router.back()}
        title="Revenir à la page précédente"
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${styles.text} ${styles.hover}`}
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        <span className="hidden sm:inline">Précédent</span>
      </button>

      <span className={`h-4 w-px ${styles.sep}`} />

      <button
        type="button"
        onClick={() => router.forward()}
        title="Revenir à la page suivante (si vous êtes revenu en arrière)"
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${styles.text} ${styles.hover}`}
      >
        <span className="hidden sm:inline">Suivant</span>
        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </button>

      <span className={`h-4 w-px ${styles.sep}`} />

      <Link
        href="/landing"
        title="Retour à l'accueil"
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${styles.text} ${styles.hover}`}
      >
        <Home className="w-4 h-4" strokeWidth={2} />
        <span className="hidden sm:inline">Accueil</span>
      </Link>
    </div>
  );
}
