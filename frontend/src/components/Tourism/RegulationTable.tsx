type RegulationStatus = 'regulated' | 'partial' | 'pending';

interface Regulation {
  island: string;
  region: string;
  status: RegulationStatus;
  measure: string;
  since: string;
}

const REGULATIONS: Regulation[] = [
  {
    island: 'Formentera',
    region: 'Baleares, España',
    status: 'regulated',
    measure: 'Limita entrada de vehículos en verano + tasa de circulación',
    since: '2019',
  },
  {
    island: 'Ibiza',
    region: 'Baleares, España',
    status: 'regulated',
    measure: 'Cupo de 20.168 vehículos foráneos/día en temporada alta',
    since: '2025',
  },
  {
    island: 'Mallorca',
    region: 'Baleares, España',
    status: 'pending',
    measure: 'Legislación en preparación tras 400K coches externos en 2023',
    since: '—',
  },
  {
    island: 'Azores',
    region: 'Portugal',
    status: 'regulated',
    measure: 'Acceso restringido a zonas turísticas con lanzaderas',
    since: 'Activo',
  },
  {
    island: 'Madeira',
    region: 'Portugal',
    status: 'pending',
    measure: 'Debate político sobre cupos (flota creció 60% en 3 años)',
    since: '—',
  },
  {
    island: 'Tenerife',
    region: 'Canarias, España',
    status: 'partial',
    measure: 'Restricciones puntuales (Teide, Anaga, La Graciosa). Sin regulación general de rent-a-car',
    since: '2024',
  },
];

function StatusBadge({ status }: { status: RegulationStatus }) {
  switch (status) {
    case 'regulated':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2.5 py-0.5 text-xs font-medium text-green">
          Regulado
        </span>
      );
    case 'partial':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
          Parcial
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          En trámite
        </span>
      );
  }
}

function getRowHighlightClass(status: RegulationStatus): string {
  if (status === 'partial') return 'bg-yellow-500/5';
  if (status === 'pending') return '';
  return '';
}

function getMobileCardClass(status: RegulationStatus): string {
  switch (status) {
    case 'regulated':
      return 'border-brand-border bg-brand-surface';
    case 'partial':
      return 'border-yellow-500/30 bg-yellow-500/5';
    case 'pending':
      return 'border-brand-border bg-brand-surface';
  }
}

export function RegulationTable() {
  return (
    <div className="rounded-xl bg-brand-card border border-brand-border p-6">
      <h3 className="text-lg font-semibold mb-1">Regulación en islas europeas</h3>
      <p className="text-xs text-slate-400 mb-4">Comparativa de medidas de control vehicular turístico</p>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-xs text-slate-500 uppercase tracking-wider">
              <th className="pb-3 pr-4">Destino</th>
              <th className="pb-3 pr-4">Región</th>
              <th className="pb-3 pr-4">Estado</th>
              <th className="pb-3 pr-4">Medida</th>
              <th className="pb-3">Desde</th>
            </tr>
          </thead>
          <tbody>
            {REGULATIONS.map((r) => (
              <tr
                key={r.island}
                className={`border-b border-brand-border/50 ${getRowHighlightClass(r.status)}`}
              >
                <td className="py-3 pr-4 font-medium">{r.island}</td>
                <td className="py-3 pr-4 text-slate-400">{r.region}</td>
                <td className="py-3 pr-4">
                  <StatusBadge status={r.status} />
                </td>
                <td className="py-3 pr-4 text-slate-300">{r.measure}</td>
                <td className="py-3 text-slate-400 text-xs">{r.since}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {REGULATIONS.map((r) => (
          <div
            key={r.island}
            className={`rounded-lg border p-3 ${getMobileCardClass(r.status)}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{r.island}</span>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-xs text-slate-400">{r.region}</p>
            <p className="text-xs text-slate-300 mt-1">{r.measure}</p>
            {r.since !== '—' && (
              <p className="text-xs text-slate-500 mt-1">Desde: {r.since}</p>
            )}
          </div>
        ))}
      </div>

      {/* Sources footer */}
      <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-brand-border/50">
        Datos verificados a marzo 2026. Fuentes: legislación autonómica de cada territorio, BOE, boletines oficiales insulares.
      </p>
    </div>
  );
}
