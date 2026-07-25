import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusStyles = {
    active: 'bg-brand-100 text-brand-700 border-brand-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusLabels = {
    active: 'Actif',
    pending: 'En attente',
    completed: 'Terminé',
    cancelled: 'Annulé',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
