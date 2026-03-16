import type { IslandComparison } from '@/types';

interface ComparisonTableProps {
  islands: IslandComparison[];
}

export function ComparisonTable({ islands }: ComparisonTableProps) {
  const sorted = [...islands].sort((a, b) => (b.tourist_resident_ratio || 0) - (a.tourist_resident_ratio || 0));

  return (
    <div className="rounded-xl bg-brand-card border border-brand-border p-6">
      <h3 className="text-lg font-semibold mb-1">Comparativa por isla</h3>
      <p className="text-xs text-slate-400 mb-4">Densidad vehicular, presión turística y regulación</p>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-xs text-slate-500 uppercase tracking-wider">
              <th className="pb-3 pr-4">Isla</th>
              <th className="pb-3 pr-4 text-right">Población</th>
              <th className="pb-3 pr-4 text-right">Vehículos/km²</th>
              <th className="pb-3 pr-4 text-right">Turistas/hab.</th>
              <th className="pb-3 text-center">Regulación</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((island) => (
              <tr key={island.island} className="border-b border-brand-border/50">
                <td className="py-3 pr-4 font-medium">{island.island}</td>
                <td className="py-3 pr-4 text-right text-slate-300 font-mono">
                  {(island.population || 0).toLocaleString('es-ES')}
                </td>
                <td className="py-3 pr-4 text-right font-mono">
                  <span className={(island.cars_per_km2 || 0) > 250 ? 'text-red-accent' : 'text-slate-300'}>
                    {(island.cars_per_km2 || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right font-mono">
                  <span className={(island.tourist_resident_ratio || 0) > 5 ? 'text-yellow' : 'text-slate-300'}>
                    {(island.tourist_resident_ratio || 0).toFixed(1)}
                  </span>
                </td>
                <td className="py-3 text-center">
                  {island.traffic_regulation && !island.traffic_regulation.toLowerCase().startsWith('no') ? (
                    <span className="inline-flex items-center rounded-full bg-green/10 px-2.5 py-0.5 text-xs font-medium text-green">
                      Sí
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-accent/10 px-2.5 py-0.5 text-xs font-medium text-red-accent">
                      No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sorted.map((island) => (
          <div
            key={island.island}
            className="rounded-lg border border-brand-border bg-brand-surface p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{island.island}</span>
              {island.traffic_regulation && !island.traffic_regulation.toLowerCase().startsWith('no') ? (
                <span className="rounded-full bg-green/10 px-2 py-0.5 text-xs font-medium text-green">
                  Regulado
                </span>
              ) : (
                <span className="rounded-full bg-red-accent/10 px-2 py-0.5 text-xs font-medium text-red-accent">
                  Sin regular
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Población</span>
                <span className="font-mono text-slate-300">
                  {(island.population || 0).toLocaleString('es-ES')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Veh./km²</span>
                <span className={`font-mono ${(island.cars_per_km2 || 0) > 250 ? 'text-red-accent' : 'text-slate-300'}`}>
                  {(island.cars_per_km2 || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Tur./hab.</span>
                <span className={`font-mono ${(island.tourist_resident_ratio || 0) > 5 ? 'text-yellow' : 'text-slate-300'}`}>
                  {(island.tourist_resident_ratio || 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
