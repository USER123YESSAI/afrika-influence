'use client';
import { useState } from 'react';

/**
 * Persiste un brouillon de formulaire dans sessionStorage le temps de
 * l'onglet, pour que naviguer en arrière/avant (RetourNav, boutons du
 * navigateur) ne fasse jamais perdre la progression d'un formulaire en
 * plusieurs étapes — ex : l'utilisateur revient en arrière vérifier les
 * conditions d'utilisation puis reprend l'inscription là où il en était.
 *
 * Ne jamais inclure de champ sensible (mot de passe) dans le brouillon
 * persisté — voir `champsExclus`.
 */
export function useDraftStorage<T extends Record<string, any>>(
  cle: string,
  valeurInitiale: T,
  champsExclus: (keyof T)[] = []
): [T, (v: T | ((prev: T) => T)) => void, () => void] {
  const [valeur, setValeurState] = useState<T>(() => {
    if (typeof window === 'undefined') return valeurInitiale;
    try {
      const brut = sessionStorage.getItem(cle);
      if (!brut) return valeurInitiale;
      return { ...valeurInitiale, ...JSON.parse(brut) };
    } catch {
      return valeurInitiale;
    }
  });

  const setValeur = (v: T | ((prev: T) => T)) => {
    setValeurState((prev) => {
      const next = typeof v === 'function' ? (v as (prev: T) => T)(prev) : v;
      try {
        const aPersister: Record<string, any> = { ...next };
        champsExclus.forEach((c) => delete aPersister[c as string]);
        sessionStorage.setItem(cle, JSON.stringify(aPersister));
      } catch {
        // sessionStorage indisponible (navigation privée stricte, etc.) — pas bloquant
      }
      return next;
    });
  };

  const effacerDraft = () => {
    try { sessionStorage.removeItem(cle); } catch { /* ignore */ }
  };

  return [valeur, setValeur, effacerDraft];
}
