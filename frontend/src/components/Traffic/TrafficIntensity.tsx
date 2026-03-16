import { useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { getTraffic, getTrafficYears } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { useIntersection } from '@/hooks/useIntersection';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

const DARK_TOOLTIP = {
  contentStyle: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8', marginBottom: '4px' },
  cursor: { fill: 'rgba(59, 130, 246, 0.08)' },
};

/** Color scale based on IMD thresholds */
function getImdColor(imd: number): string {
  if (imd >= 80_000) return '#ef4444'; // red — extreme
  if (imd >= 50_000) return '#f97316'; // orange — very high
  if (imd >= 20_000) return '#eab308'; // yellow — high
  return '#22c55e'; // green — moderate
}

function formatThousands(value: number): string {
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

export function TrafficIntensity() {
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [ref, isVisible] = useIntersection(0.1);

  const fetchTraffic = useCallback(
    () => getTraffic(selectedYear),
    [selectedYear]
  );

  const {
    data: trafficData,
    loading: trafficLoading,
    error: trafficError,
    refetch: refetchTraffic,
  } = useFetch(fetchTraffic, [selectedYear]);

  const {
    data: yearsData,
  } = useFetch(getTrafficYears);

  // Build chart data from roads_summary — top 15 by max_imd
  const chartData = trafficData
    ? trafficData.roads_summary
        .filter((r) => r.max_imd > 0)
        .sort((a, b) => b.max_imd - a.max_imd)
        .slice(0, 15)
        .reverse() // lowest at top for horizontal bar chart readability
        .map((r) => ({
          road: r.road,
          imd: r.max_imd,
          stations: r.stations,
        }))
    : [];

  const displayYear = trafficData?.year ?? selectedYear ?? '';
  const availableYears = yearsData?.available_years ?? [];

  return (
    <section
      id="traffic"
      ref={ref}
      className="relative py-20"
      aria-label="Intensidad de tráfico en las carreteras de Tenerife"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-surface to-brand-bg pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-12">
          <p className="text-red-accent font-mono text-sm tracking-widest uppercase mb-3">
            Saturación viaria
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Intensidad de <span className="gradient-text-red">Tráfico</span>
          </h2>
          <p className="text-slate-300 max-w-2xl">
            Las principales carreteras de Tenerife soportan más de 100.000 vehículos
            al día. Estos datos de aforo muestran la presión real sobre la red viaria.
          </p>
        </div>

        {/* Year selector */}
        {availableYears.length > 1 && (
          <div className="mb-6 flex items-center gap-3">
            <label
              htmlFor="traffic-year-select"
              className="text-sm text-slate-400 font-medium"
            >
              Año:
            </label>
            <select
              id="traffic-year-select"
              value={selectedYear ?? ''}
              onChange={(e) =>
                setSelectedYear(e.target.value ? Number(e.target.value) : undefined)
              }
              className="rounded-lg border border-brand-border bg-brand-card px-3 py-1.5
                         text-sm text-white focus:outline-none focus:ring-2
                         focus:ring-brand-blue/50"
            >
              <option value="">Más reciente</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Chart */}
        {trafficError ? (
          <ErrorState message={trafficError} onRetry={refetchTraffic} />
        ) : trafficLoading ? (
          <CardSkeleton />
        ) : chartData.length > 0 ? (
          <div
            className={`rounded-xl bg-brand-card border border-brand-border p-6
                        transition-all duration-700
                        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <h3 className="text-lg font-semibold mb-1">
              Intensidad de tráfico por carretera
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Vehículos/día (IMD) · Estaciones de aforo · Fuente: datos.tenerife.es
              {displayYear ? ` (${displayYear})` : ''}
            </p>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#22c55e]" />
                {'< 20K'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#eab308]" />
                20K - 50K
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#f97316]" />
                50K - 80K
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#ef4444]" />
                {'> 80K'}
              </span>
              <span className="ml-auto text-slate-500">vehículos/día</span>
            </div>

            <div className="h-[480px] sm:h-[520px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(51,65,85,0.5)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={formatThousands}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="road"
                    width={70}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip
                    {...DARK_TOOLTIP}
                    formatter={(value: number) => [
                      value.toLocaleString('es-ES') + ' vehículos/día',
                      'IMD máxima',
                    ]}
                    labelFormatter={(label: string, payload) => {
                      const item = payload?.[0]?.payload;
                      const stationCount = item?.stations ?? 0;
                      return `${label} — ${stationCount} estación${stationCount !== 1 ? 'es' : ''} de aforo`;
                    }}
                  />
                  <Bar dataKey="imd" radius={[0, 6, 6, 0]} barSize={22}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={getImdColor(entry.imd)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary stats */}
            {trafficData && (
              <div className="mt-4 pt-4 border-t border-brand-border flex flex-wrap gap-6 text-xs text-slate-400">
                <span>
                  <span className="text-white font-mono font-medium">
                    {trafficData.total.toLocaleString('es-ES')}
                  </span>{' '}
                  estaciones de aforo
                </span>
                <span>
                  <span className="text-white font-mono font-medium">
                    {trafficData.roads_summary.length}
                  </span>{' '}
                  carreteras monitorizadas
                </span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
