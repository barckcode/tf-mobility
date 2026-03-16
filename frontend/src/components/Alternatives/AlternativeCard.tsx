import type { Alternative } from '@/types';

interface AlternativeCardProps {
  alternative: Alternative;
}

const TYPE_ICONS: Record<string, string> = {
  tranvia: '\u{1F68B}',
  bus: '\u{1F68C}',
  demand: '\u{1F4F1}',
  train: '\u{1F682}',
  bike: '\u{1F6B2}',
  vtc: '\u{1F695}',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Operativo', color: 'text-green', bg: 'bg-green/10' },
  planned: { label: 'Planificado', color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
  limited: { label: 'Limitado', color: 'text-yellow', bg: 'bg-yellow/10' },
  suspended: { label: 'Suspendido', color: 'text-red-accent', bg: 'bg-red-accent/10' },
};

export function AlternativeCard({ alternative }: AlternativeCardProps) {
  const icon = TYPE_ICONS[alternative.type] || '\u{1F698}';
  const status = STATUS_CONFIG[alternative.status] || STATUS_CONFIG.limited;

  return (
    <div className="rounded-xl bg-brand-card border border-brand-border p-5 hover:border-green/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-white">{alternative.name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color} ${status.bg}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-3">{alternative.description}</p>

          <div className="flex flex-wrap gap-4 text-xs">
            {alternative.users_annual != null && alternative.users_annual > 0 && (
              <div>
                <span className="text-slate-500">Usuarios/año: </span>
                <span className="font-mono font-medium text-green">
                  {alternative.users_annual.toLocaleString('es-ES')}
                </span>
              </div>
            )}
            {alternative.coverage_pct != null && alternative.coverage_pct > 0 && (
              <div>
                <span className="text-slate-500">Cobertura: </span>
                <span className="font-mono font-medium text-green">
                  {alternative.coverage_pct}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
