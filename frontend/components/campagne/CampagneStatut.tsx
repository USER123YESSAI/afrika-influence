import type { StatutCampagne } from '@/lib/api';

const CONFIG: Record<StatutCampagne, { label: string; classes: string }> = {
  BROUILLON:             { label: 'Brouillon',            classes: 'bg-gray-100 text-gray-700' },
  PUBLIEE:               { label: 'Publiée',              classes: 'bg-blue-100 text-blue-700' },
  EN_COURS:              { label: 'En cours',             classes: 'bg-green-100 text-green-700' },
  EN_ATTENTE_VALIDATION: { label: 'En attente',           classes: 'bg-amber-100 text-amber-700' },
  TERMINEE:              { label: 'Terminée',             classes: 'bg-violet-100 text-violet-700' },
  ANNULEE:               { label: 'Annulée',              classes: 'bg-red-100 text-red-700' },
};

export default function CampagneStatut({ statut }: { statut: StatutCampagne }) {
  const { label, classes } = CONFIG[statut] ?? { label: statut, classes: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
