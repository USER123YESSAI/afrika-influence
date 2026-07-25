'use client';

import { getFactureUrl } from '@/lib/api';
import type { Paiement } from '@/lib/api';

export default function FactureButton({ paiement }: { paiement: Paiement }) {
  if (paiement.statut !== 'CONFIRME' || !paiement.numeroFacture) return null;

  return (
    <a
      href={getFactureUrl(paiement.id)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors font-medium"
    >
      ↓ {paiement.numeroFacture}
    </a>
  );
}
