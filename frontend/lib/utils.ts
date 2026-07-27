export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getReseauxList(reseaux: any): string[] {
  if (!reseaux) return [];
  if (typeof reseaux === 'string') {
    try {
      return getReseauxList(JSON.parse(reseaux));
    } catch {
      const trimmed = reseaux.trim();
      return trimmed ? [trimmed] : [];
    }
  }
  if (Array.isArray(reseaux)) {
    return reseaux
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          return item.nom || item.reseau || item.platform || item.name || '';
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof reseaux === 'object') {
    return Object.keys(reseaux).filter((k) => isNaN(Number(k)));
  }
  return [];
}

export function formatReseaux(reseaux: any): string {
  const list = getReseauxList(reseaux);
  return list.length ? list.join(', ') : '—';
}

export function getReseauxEntries(reseaux: any): [string, any][] {
  if (!reseaux) return [];
  if (typeof reseaux === 'string') {
    try {
      return getReseauxEntries(JSON.parse(reseaux));
    } catch {
      const trimmed = reseaux.trim();
      return trimmed ? [[trimmed, {}]] : [];
    }
  }
  if (Array.isArray(reseaux)) {
    return reseaux
      .map((item): [string, any] | null => {
        if (typeof item === 'string') return [item, {}];
        if (typeof item === 'object' && item !== null) {
          const nom = item.nom || item.reseau || item.platform || item.name || '';
          return nom ? [nom, item] : null;
        }
        return null;
      })
      .filter(Boolean) as [string, any][];
  }
  if (typeof reseaux === 'object') {
    return Object.entries(reseaux).filter(([k]) => isNaN(Number(k)));
  }
  return [];
}

export function getTotalAudience(reseaux: any, fallbackAudience = 0): number {
  if (!reseaux) return Number(fallbackAudience) || 0;
  if (typeof reseaux === 'string') {
    try {
      return getTotalAudience(JSON.parse(reseaux), fallbackAudience);
    } catch {
      return Number(fallbackAudience) || 0;
    }
  }
  if (Array.isArray(reseaux)) {
    const sum: number = (reseaux as any[]).reduce((s: number, r: any) => s + (Number(r?.audience) || 0), 0);
    return sum > 0 ? sum : Number(fallbackAudience) || 0;
  }
  if (typeof reseaux === 'object') {
    const sum: number = (Object.values(reseaux) as any[]).reduce((s: number, r: any) => s + (Number(r?.audience) || 0), 0);
    return sum > 0 ? sum : Number(fallbackAudience) || 0;
  }
  return Number(fallbackAudience) || 0;
}


