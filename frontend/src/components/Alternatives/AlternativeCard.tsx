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
  operativo: { label: 'Operativo', color: 'text-green', bg: 'bg-green/10' },
  en_estudio: { label: 'En estudio', color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
  futuro: { label: 'Planificado', color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
  fragmentado: { label: 'Fragmentado', color: 'text-yellow', bg: 'bg-yellow/10' },
  reciente: { label: 'Reciente', color: 'text-green', bg: 'bg-green/10' },
  suspendido: { label: 'Suspendido', color: 'text-red-accent', bg: 'bg-red-accent/10' },
};

export function AlternativeCard({ alternative }: AlternativeCardProps) {
  const icon = TYPE_ICONS[alternative.type] || '\u{1F698}';
  const status = STATUS_CONFIG[alternative.status] || STATUS_CONFIG.fragmentado;

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
            {alternative.annual_users != null && alternative.annual_users > 0 && (
              <div>
                <span className="text-slate-500">Usuarios/año: </span>
                <span className="font-mono font-medium text-green">
                  {(alternative.annual_users || 0).toLocaleString('es-ES')}
                </span>
              </div>
            )}
            {alternative.coverage && (
              <div>
                <span className="text-slate-500">Cobertura: </span>
                <span className="font-mono font-medium text-green">
                  {alternative.coverage}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
