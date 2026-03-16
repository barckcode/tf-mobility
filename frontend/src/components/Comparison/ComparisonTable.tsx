import { Fragment } from 'react';
import type { IslandComparison } from '@/types';

interface ComparisonTableProps {
  islands: IslandComparison[];
}

function getGroupOrder(community: string): number {
  if (community === 'Canarias') return 0;
  if (community === 'Illes Balears') return 1;
  return 2;
}

function getGroupLabel(community: string): string {
  if (community === 'Canarias') return 'Canarias';
  if (community === 'Illes Balears') return 'Baleares';
  return 'Internacional';
}

interface GroupedIslands {
  label: string;
  islands: IslandComparison[];
}

function groupAndSort(islands: IslandComparison[]): GroupedIslands[] {
  const sorted = [...islands].sort((a, b) => {
    const groupDiff = getGroupOrder(a.community) - getGroupOrder(b.community);
    if (groupDiff !== 0) return groupDiff;
    return (b.cars_per_km2 || 0) - (a.cars_per_km2 || 0);
  });

  const groups: GroupedIslands[] = [];
  let currentGroup: GroupedIslands | null = null;

  for (const island of sorted) {
    const label = getGroupLabel(island.community);
    if (!currentGroup || currentGroup.label !== label) {
      currentGroup = { label, islands: [] };
      groups.push(currentGroup);
    }
    currentGroup.islands.push(island);
  }

  return groups;
}

export function ComparisonTable({ islands }: ComparisonTableProps) {
  const groups = groupAndSort(islands);

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
            {groups.map((group, groupIdx) => (
              <Fragment key={group.label}>
                <tr>
                  <td
                    colSpan={5}
                    className={`pt-4 pb-1 text-xs text-slate-500 font-mono uppercase tracking-wider${groupIdx > 0 ? ' border-t border-brand-border' : ''}`}
                  >
                    {group.label}
                  </td>
                </tr>
                {group.islands.map((island) => (
                  <tr
                    key={island.island}
                    className={`border-b border-brand-border/50 ${
                      island.island === 'Tenerife'
                        ? 'bg-red-accent/5 border-l-2 border-l-red-accent'
                        : ''
                    }`}
                  >
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
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {groups.map((group, groupIdx) => (
          <div key={group.label}>
            <p
              className={`text-xs text-slate-500 font-mono uppercase tracking-wider pb-1 mb-2${groupIdx > 0 ? ' pt-3 border-t border-brand-border' : ''}`}
            >
              {group.label}
            </p>
            <div className="space-y-3">
              {group.islands.map((island) => (
                <div
                  key={island.island}
                  className={`rounded-lg p-3 ${
                    island.island === 'Tenerife'
                      ? 'border-2 border-red-accent/40 bg-red-accent/5'
                      : 'border border-brand-border bg-brand-surface'
                  }`}
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
        ))}
      </div>
    </div>
  );
}
