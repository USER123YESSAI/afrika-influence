'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Barre de navigation "Page précédente / Retour à l'accueil", utilisée sur
 * les pages publiques (connexion, inscription) pour permettre à l'utilisateur
 * de sortir du tunnel d'authentification sans utiliser le bouton retour du
 * navigateur.
 */
export default function RetourNav({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const router = useRouter();

  const styles = theme === 'dark'
    ? { text: 'text-fog hover:text-cyan', sep: 'text-hairline' }
    : { text: 'text-gray-500 hover:text-emerald-600', sep: 'text-gray-300' };

  return (
    <div className={`flex items-center gap-3 text-sm mb-8 ${styles.text}`}>
      <button
        type="button"
        onClick={() => router.back()}
        className={`inline-flex items-center gap-2 transition-colors ${styles.text}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Page précédente
      </button>
      <span className={styles.sep}>·</span>
      <Link href="/landing" className={`inline-flex items-center gap-2 transition-colors ${styles.text}`}>
        Retour à l'accueil
      </Link>
    </div>
  );
}
