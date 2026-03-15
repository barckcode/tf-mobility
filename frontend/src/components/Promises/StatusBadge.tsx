import type { Project } from '@/types';

type Status = Project['status'];

const STATUS_CONFIG: Record<Status, { color: string; bg: string; label: string; dot: string }> = {
  completado: {
    color: 'text-green',
    bg: 'bg-green/10 border-green/20',
    label: 'Completado',
    dot: 'bg-green',
  },
  en_plazo: {
    color: 'text-green',
    bg: 'bg-green/10 border-green/20',
    label: 'En plazo',
    dot: 'bg-green',
  },
  retrasado: {
    color: 'text-yellow',
    bg: 'bg-yellow/10 border-yellow/20',
    label: 'Retrasado',
    dot: 'bg-yellow',
  },
  paralizado: {
    color: 'text-red-accent',
    bg: 'bg-red-accent/10 border-red-accent/20',
    label: 'Paralizado',
    dot: 'bg-red-accent',
  },
  sin_iniciar: {
    color: 'text-red-accent',
    bg: 'bg-red-accent/10 border-red-accent/20',
    label: 'Sin iniciar',
    dot: 'bg-red-accent',
  },
};

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.sin_iniciar;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5
                  font-medium ${config.bg} ${config.color}
                  ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function getStatusGroup(status: Status): 'green' | 'yellow' | 'red' {
  if (status === 'completado' || status === 'en_plazo') return 'green';
  if (status === 'retrasado') return 'yellow';
  return 'red';
}
