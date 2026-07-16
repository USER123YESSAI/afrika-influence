'use client';
import { STATUT_LABELS } from '@/lib/api';

import { getUser } from '@/lib/api';

export function StatusBadge({ statut }: { statut: string }) {
  const userRole = typeof window !== 'undefined' ? (getUser()?.role ?? '') : '';
  const info = STATUT_LABELS[statut] ?? { label: statut, color: 'bg-gray-100 text-gray-700' };
  
  let finalLabel = info.label;
  if (statut === 'INVITATION_ENVOYEE' && userRole === 'CREATEUR') {
    finalLabel = 'Invitation reçue';
  }
  if (statut === 'CANDIDATURE_ENVOYEE' && (userRole === 'ENTREPRISE' || userRole === 'PARTICULIER')) {
    finalLabel = 'Candidature reçue';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.color}`}>
      {finalLabel}
    </span>
  );
}
