import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { getTraffic, getTrafficYears } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { useIntersection } from '@/hooks/useIntersection';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import type { TrafficResponse, RoadSummary } from '@/types';

/* ── Constants ────────────────────────────────────────────────── */

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
  cursor: { stroke: '#475569' },
};

const LINE_COLORS: Record<string, string> = {
  'TF-5': '#ef4444',
  'TF-1': '#3b82f6',
  'TF-2': '#22c55e',
  'TF-13': '#eab308',
  'TF-28': '#94a3b8',
};

const TOP_ROADS_COUNT = 5;
const BAR_CHART_ROADS = 10;

/* ── Helpers ──────────────────────────────────────────────────── */

/** Color scale based on IMD thresholds */
function getImdColor(imd: number): string {
  if (imd >= 80_000) return '#ef4444';
  if (imd >= 50_000) return '#f97316';
  if (imd >= 20_000) return '#eab308';
  return '#22c55e';
}

function formatThousands(value: number): string {
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

function fmtEs(n: number): string {
  return n.toLocaleString('es-ES');
}

/** Find a road's max_imd in a roads_summary array */
function findRoadImd(summary: RoadSummary[], road: string): number | undefined {
  return summary.find((r) => r.road === road)?.max_imd;
}

/* ── Evolution data types ─────────────────────────────────────── */

interface EvolutionRow {
  year: string;
  [road: string]: string | number;
}

interface EvolutionState {
  rows: EvolutionRow[];
  topRoads: string[];
  loading: boolean;
  error: string | null;
}

/* ── Component ────────────────────────────────────────────────── */

export function TrafficIntensity() {
  const [ref, isVisible] = useIntersection(0.1);

  /* Latest-year data (for KPIs + bar chart) */
  const fetchLatest = useCallback(() => getTraffic(), []);
  const {
    data: latestData,
    loading: latestLoading,
    error: latestError,
    refetch: refetchLatest,
  } = useFetch(fetchLatest);

  /* Available years */
  const { data: yearsData } = useFetch(getTrafficYears);
  const availableYears = yearsData?.available_years ?? [];

  /* Evolution data (all years) */
  const [evolution, setEvolution] = useState<EvolutionState>({
    rows: [],
    topRoads: [],
    loading: true,
    error: null,
  });

  /* Earliest-year data (for growth KPI) */
  const [earliestData, setEarliestData] = useState<TrafficResponse | null>(null);

  useEffect(() => {
    if (availableYears.length === 0) return;

    let cancelled = false;

    async function fetchEvolution() {
      try {
        const sortedYears = [...availableYears].sort((a, b) => a - b);

        // Fetch all years in parallel
        const allResponses = await Promise.all(
          sortedYears.map((y) => getTraffic(y))
        );

        if (cancelled) return;

        // Store earliest for growth KPI
        setEarliestData(allResponses[0]);

        // Determine top N roads by latest year's max_imd
        const latestResp = allResponses[allResponses.length - 1];
        const topRoads = latestResp.roads_summary
          .filter((r) => r.max_imd > 0)
          .sort((a, b) => b.max_imd - a.max_imd)
          .slice(0, TOP_ROADS_COUNT)
          .map((r) => r.road);

        // Build evolution rows
        const rows: EvolutionRow[] = sortedYears.map((year, i) => {
          const resp = allResponses[i];
          const row: EvolutionRow = { year: String(year) };
          for (const road of topRoads) {
            const imd = findRoadImd(resp.roads_summary, road);
            if (imd !== undefined) {
              row[road] = imd;
            }
          }
          return row;
        });

        setEvolution({ rows, topRoads, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          setEvolution((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : 'Error loading evolution data',
          }));
        }
      }
    }

    fetchEvolution();
    return () => {
      cancelled = true;
    };
  }, [availableYears]);

  /* ── Derived values ───────────────────────────────────────── */

  const totalStations = latestData?.total ?? 0;
  const roadsSummary = latestData?.roads_summary ?? [];
  const busiestRoad = roadsSummary.length > 0
    ? [...roadsSummary].sort((a, b) => b.max_imd - a.max_imd)[0]
    : null;

  const uniqueRoads = roadsSummary.length;
  const latestYear = latestData?.year;
  const earliestYear = availableYears.length > 0
    ? Math.min(...availableYears)
    : undefined;

  // Growth calculation for TF-5
  const tf5Growth = (() => {
    if (!earliestData || !latestData) return null;
    const earliestImd = findRoadImd(earliestData.roads_summary, 'TF-5');
    const latestImd = findRoadImd(latestData.roads_summary, 'TF-5');
    if (!earliestImd || !latestImd || earliestImd === 0) return null;
    return ((latestImd - earliestImd) / earliestImd) * 100;
  })();

  // Bar chart data — top 10 roads for latest year
  const barChartData = latestData
    ? latestData.roads_summary
        .filter((r) => r.max_imd > 0)
        .sort((a, b) => b.max_imd - a.max_imd)
        .slice(0, BAR_CHART_ROADS)
        .reverse()
        .map((r) => ({
          road: r.road,
          imd: r.max_imd,
          stations: r.stations,
        }))
    : [];

  const isLoading = latestLoading || evolution.loading;
  const hasError = latestError || evolution.error;

  /* ── Render ───────────────────────────────────────────────── */

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

        {hasError ? (
          <ErrorState
            message={latestError ?? evolution.error ?? 'Error desconocido'}
            onRetry={refetchLatest}
          />
        ) : isLoading ? (
          <CardSkeleton />
        ) : (
          <div className="space-y-8">
            {/* ── Section 1: KPI cards ────────────────────────── */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
                          transition-all duration-700
                          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              {/* Estaciones de aforo */}
              <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                  Estaciones de aforo
                </p>
                <p className="text-3xl font-bold font-mono text-white">
                  {fmtEs(totalStations)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  puntos de medición en la isla
                </p>
              </div>

              {/* Vía más transitada */}
              <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                  Vía más transitada
                </p>
                <p className="text-3xl font-bold font-mono text-white">
                  {busiestRoad?.road ?? '—'}
                </p>
                {busiestRoad && (
                  <p className="text-sm text-red-accent font-mono mt-0.5">
                    {fmtEs(busiestRoad.max_imd)} veh/día
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Padre Anchieta (SC – La Laguna)
                </p>
              </div>

              {/* Crecimiento TF-5 */}
              <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                  Crecimiento TF-5
                </p>
                <p className="text-3xl font-bold font-mono text-white">
                  {tf5Growth !== null
                    ? `${tf5Growth >= 0 ? '+' : ''}${tf5Growth.toFixed(1).replace('.', ',')}%`
                    : '—'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {earliestYear && latestYear
                    ? `${earliestYear} → ${latestYear}`
                    : '—'}
                </p>
              </div>

              {/* Carreteras monitorizadas */}
              <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                  Carreteras monitorizadas
                </p>
                <p className="text-3xl font-bold font-mono text-white">
                  {uniqueRoads}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  red viaria insular
                </p>
              </div>
            </div>

            {/* ── Section 2: Evolution line chart ─────────────── */}
            {evolution.rows.length > 0 && (
              <div
                className={`rounded-xl bg-brand-card border border-brand-border p-6
                            transition-all duration-700 delay-150
                            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              >
                <h3 className="text-lg font-semibold mb-1">
                  Evolución del tráfico en las principales vías
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Intensidad Media Diaria (IMD) máxima por carretera · Fuente: datos.tenerife.es
                  {earliestYear && latestYear
                    ? ` (${earliestYear}-${latestYear})`
                    : ''}
                </p>

                <div className="h-[400px] sm:h-[440px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={evolution.rows}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(51,65,85,0.5)"
                      />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={{ stroke: '#334155' }}
                      />
                      <YAxis
                        tickFormatter={formatThousands}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={{ stroke: '#334155' }}
                        width={60}
                      />
                      <Tooltip
                        {...DARK_TOOLTIP}
                        formatter={(value: number, name: string) => [
                          fmtEs(value) + ' veh/día',
                          name,
                        ]}
                        labelFormatter={(label: string) => `Año ${label}`}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                      />
                      {evolution.topRoads.map((road) => (
                        <Line
                          key={road}
                          type="monotone"
                          dataKey={road}
                          name={road}
                          stroke={LINE_COLORS[road] ?? '#8b5cf6'}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: LINE_COLORS[road] ?? '#8b5cf6' }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── Section 3: Bar chart snapshot ───────────────── */}
            {barChartData.length > 0 && (
              <div
                className={`rounded-xl bg-brand-card border border-brand-border p-6
                            transition-all duration-700 delay-300
                            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              >
                <h3 className="text-lg font-semibold mb-1">
                  Ranking de carreteras por tráfico diario
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  IMD máxima por vía · {latestYear ?? ''}
                </p>

                {/* Color legend */}
                <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#22c55e]" />
                    {'< 20K'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#eab308]" />
                    20K – 50K
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#f97316]" />
                    50K – 80K
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#ef4444]" />
                    {'> 80K'}
                  </span>
                  <span className="ml-auto text-slate-500">vehículos/día</span>
                </div>

                <div className="h-[360px] sm:h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
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
                        cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                        formatter={(value: number) => [
                          fmtEs(value) + ' vehículos/día',
                          'IMD máxima',
                        ]}
                        labelFormatter={(label: string, payload) => {
                          const item = payload?.[0]?.payload as
                            | { stations?: number }
                            | undefined;
                          const stationCount = item?.stations ?? 0;
                          return `${label} — ${stationCount} estación${stationCount !== 1 ? 'es' : ''} de aforo`;
                        }}
                      />
                      <Bar dataKey="imd" radius={[0, 6, 6, 0]} barSize={18}>
                        {barChartData.map((entry, i) => (
                          <Cell key={i} fill={getImdColor(entry.imd)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
