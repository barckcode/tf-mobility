import { useEffect, useState, useMemo } from 'react';
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
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useIntersection } from '@/hooks/useIntersection';
import { useFetch } from '@/hooks/useFetch';
import {
  getTransitSummary,
  getTransitStops,
  getTransitCorridors,
} from '@/lib/api';
import type { Corridor } from '@/types';

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

const CORRIDOR_COLORS: Record<string, string> = {
  'TF-1': '#3b82f6',
  'TF-5': '#ef4444',
  'TF-2': '#22c55e',
  'TF-13': '#eab308',
  'TF-28': '#94a3b8',
};

function fmtEs(n: number): string {
  return n.toLocaleString('es-ES');
}

function formatThousands(value: number): string {
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

/* ── Component ────────────────────────────────────────────────── */

export function TransitPage() {
  /* Scroll to top on mount */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  /* Data fetching */
  const { data: summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } =
    useFetch(getTransitSummary);
  const { data: stopsData, loading: stopsLoading, error: stopsError, refetch: refetchStops } =
    useFetch(getTransitStops);
  const { data: corridorsData, loading: corridorsLoading, error: corridorsError, refetch: refetchCorridors } =
    useFetch(getTransitCorridors);

  /* Intersection observers for animations */
  const [heroRef, heroVisible] = useIntersection(0.1);
  const [kpiRef, kpiVisible] = useIntersection(0.1);
  const [chartRef, chartVisible] = useIntersection(0.1);
  const [corridorsRef, corridorsVisible] = useIntersection(0.1);
  const [desertsRef, desertsVisible] = useIntersection(0.1);
  const [conclusionRef, conclusionVisible] = useIntersection(0.1);

  /* Corridor accordion state */
  const [openCorridor, setOpenCorridor] = useState<string | null>(null);

  /* ── Derived data ───────────────────────────────────────────── */

  /* Top 10 busiest stops for the bar chart */
  const top10Stops = useMemo<{ name: string; buses_dia: number }[]>(() => {
    if (!stopsData?.stops) return [];
    return [...stopsData.stops]
      .sort((a, b) => b.buses_dia - a.buses_dia)
      .slice(0, 10)
      .reverse()
      .map((s) => ({
        name: s.name.length > 30 ? s.name.slice(0, 28) + '...' : s.name,
        buses_dia: s.buses_dia,
      }));
  }, [stopsData]);

  /* Transport desert stats */
  const desertStats = useMemo(() => {
    if (!stopsData?.stops) return null;
    const stops = stopsData.stops;
    const under5 = stops.filter((s) => s.buses_dia < 5).length;
    const under10 = stops.filter((s) => s.buses_dia < 10).length;
    const under20 = stops.filter((s) => s.buses_dia < 20).length;
    const total = stops.length;
    return { under5, under10, under20, total };
  }, [stopsData]);

  /* ── Bar color based on frequency ──────────────────────────── */
  function getBusColor(buses: number): string {
    if (buses >= 100) return '#16C79A';
    if (buses >= 50) return '#22c55e';
    if (buses >= 20) return '#eab308';
    return '#ef4444';
  }

  const isLoading = summaryLoading || stopsLoading || corridorsLoading;
  const hasError = summaryError || stopsError || corridorsError;

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      <Header />
      <main>
        {/* ── Section 1: Hero / Intro ───────────────────────────── */}
        <section
          ref={heroRef}
          className="relative pt-28 pb-16"
          aria-label="Transporte Público - Introducción"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-surface pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full
                          bg-green/[0.04] blur-3xl pointer-events-none" />

          <div
            className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 text-center
                        transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <p className="text-green font-mono text-sm tracking-widest uppercase mb-3">
              Estudio de movilidad
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Transporte <span className="text-green">Público</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-2">
              Análisis de la red de guaguas
            </p>
            <p className="text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Un estudio de la red de transporte público de TITSA en Tenerife.
              Más de 3.800 paradas y 177 rutas que, pese a su extensión, resultan
              insuficientes como alternativa real al vehículo privado frente a la
              congestión diaria que sufre la isla.
            </p>
          </div>
        </section>

        {hasError ? (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
            <ErrorState
              message={summaryError ?? stopsError ?? corridorsError ?? 'Error desconocido'}
              onRetry={() => {
                refetchSummary();
                refetchStops();
                refetchCorridors();
              }}
            />
          </div>
        ) : isLoading ? (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <>
            {/* ── Section 2: KPI Cards ────────────────────────────── */}
            {summary && (
              <section
                ref={kpiRef}
                className="relative py-12"
                aria-label="Resumen del transporte público"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
                                transition-all duration-700
                                ${kpiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Total paradas
                      </p>
                      <p className="text-3xl font-bold font-mono text-white">
                        {fmtEs(summary.total_stops)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        red de guaguas TITSA
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Total rutas
                      </p>
                      <p className="text-3xl font-bold font-mono text-white">
                        {fmtEs(summary.total_routes)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        líneas de guagua activas
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Media buses/día por parada
                      </p>
                      <p className="text-3xl font-bold font-mono text-white">
                        {summary.avg_buses_per_day.toFixed(1).replace('.', ',')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        frecuencia promedio
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Rutas en vías congestionadas
                      </p>
                      <p className="text-3xl font-bold font-mono text-green">
                        {fmtEs(summary.routes_on_congested_roads)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        comparten autopista con miles de coches
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Section 3: Top 10 Busiest Stops ─────────────────── */}
            {top10Stops.length > 0 && (
              <section
                ref={chartRef}
                className="relative py-12"
                aria-label="Top 10 paradas más frecuentadas"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-bg to-brand-surface pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                  <div
                    className={`rounded-xl bg-brand-card border border-brand-border p-6
                                transition-all duration-700
                                ${chartVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <h2 className="text-lg font-semibold mb-1">
                      Top 10 paradas más frecuentadas
                    </h2>
                    <p className="text-xs text-slate-400 mb-6">
                      Paradas con mayor número de guaguas diarias · Fuente: TITSA / Cabildo de Tenerife
                    </p>

                    {/* Color legend */}
                    <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#ef4444]" />
                        {'< 20'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#eab308]" />
                        20 – 50
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#22c55e]" />
                        50 – 100
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#16C79A]" />
                        {'> 100'}
                      </span>
                      <span className="ml-auto text-slate-500">buses/día</span>
                    </div>

                    <div className="h-[400px] sm:h-[440px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={top10Stops}
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
                            dataKey="name"
                            width={160}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            axisLine={{ stroke: '#334155' }}
                          />
                          <Tooltip
                            {...DARK_TOOLTIP}
                            cursor={{ fill: 'rgba(22, 199, 154, 0.08)' }}
                            formatter={(value: number) => [
                              fmtEs(value) + ' buses/día',
                              'Frecuencia',
                            ]}
                          />
                          <Bar dataKey="buses_dia" radius={[0, 6, 6, 0]} barSize={18}>
                            {top10Stops.map((entry, i) => (
                              <Cell key={i} fill={getBusColor(entry.buses_dia)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Section 4: Congested Corridors ──────────────────── */}
            {corridorsData && corridorsData.corridors.length > 0 && (
              <section
                ref={corridorsRef}
                className="relative py-12"
                aria-label="Corredores congestionados"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                  <div className="mb-8">
                    <p className="text-green font-mono text-sm tracking-widest uppercase mb-3">
                      Análisis de corredores
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                      Corredores <span className="text-green">congestionados</span>
                    </h2>
                    <p className="text-slate-300 max-w-2xl">
                      Las principales autopistas de Tenerife son compartidas por miles de coches
                      y solo un puñado de líneas de guagua. Las rutas de autobús compiten
                      directamente con el tráfico privado sin carriles exclusivos.
                    </p>
                  </div>

                  <div
                    className={`space-y-3 transition-all duration-700
                                ${corridorsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    {corridorsData.corridors.map((corridor: Corridor) => {
                      const isOpen = openCorridor === corridor.road_code;
                      const color = CORRIDOR_COLORS[corridor.road_code] ?? '#8b5cf6';

                      return (
                        <div
                          key={corridor.road_code}
                          className="rounded-xl bg-brand-card border border-brand-border overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenCorridor(isOpen ? null : corridor.road_code)}
                            className="w-full flex items-center justify-between p-5 text-left
                                       hover:bg-brand-surface/50 transition-colors"
                            aria-expanded={isOpen}
                          >
                            <div className="flex items-center gap-4">
                              <span
                                className="inline-block w-2 h-10 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <div>
                                <span className="font-mono text-lg font-bold text-white">
                                  {corridor.road_code}
                                </span>
                                <p className="text-sm text-slate-400 mt-0.5">
                                  {corridor.routes.length} ruta{corridor.routes.length !== 1 ? 's' : ''} de guagua
                                </p>
                              </div>
                            </div>

                            {/* Bus vs Cars visual indicator */}
                            <div className="flex items-center gap-4">
                              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                                <div className="flex items-center gap-1">
                                  <span className="text-green font-mono font-bold">
                                    {corridor.routes.length}
                                  </span>
                                  <span>guaguas</span>
                                </div>
                                <span className="text-slate-600">vs</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-red-accent font-mono font-bold">miles</span>
                                  <span>coches</span>
                                </div>
                              </div>
                              <svg
                                className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>

                          {isOpen && (
                            <div className="px-5 pb-5 border-t border-brand-border/50">
                              <div className="pt-4 space-y-2">
                                {corridor.routes.map((route) => (
                                  <div
                                    key={route.route_id}
                                    className="flex items-start gap-3 rounded-lg bg-brand-surface/50
                                               border border-brand-border/30 p-3"
                                  >
                                    <span
                                      className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1
                                                 rounded-md text-xs font-bold font-mono text-white"
                                      style={{ backgroundColor: color }}
                                    >
                                      {route.short_name}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-white font-medium truncate">
                                        {route.long_name}
                                      </p>
                                      <p className="text-xs text-slate-400 mt-0.5">
                                        {route.overlap_description}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Visual ratio bar */}
                              <div className="mt-4">
                                <p className="text-xs text-slate-500 mb-2">
                                  Proporción buses vs coches (representación visual)
                                </p>
                                <div className="h-3 rounded-full overflow-hidden bg-brand-surface flex">
                                  <div
                                    className="h-full rounded-l-full transition-all"
                                    style={{
                                      width: `${Math.max(2, Math.min(corridor.routes.length * 2, 15))}%`,
                                      backgroundColor: '#16C79A',
                                    }}
                                  />
                                  <div
                                    className="h-full flex-1 rounded-r-full"
                                    style={{ backgroundColor: '#E94560' }}
                                  />
                                </div>
                                <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                                  <span>Guaguas ({corridor.routes.length} rutas)</span>
                                  <span>Vehículos privados</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ── Section 5: Transport Deserts ────────────────────── */}
            {desertStats && (
              <section
                ref={desertsRef}
                className="relative py-12"
                aria-label="Desiertos de transporte"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-bg to-brand-surface pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                  <div className="mb-8">
                    <p className="text-red-accent font-mono text-sm tracking-widest uppercase mb-3">
                      Zonas desatendidas
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                      Desiertos de <span className="gradient-text-red">transporte</span>
                    </h2>
                    <p className="text-slate-300 max-w-2xl">
                      Miles de paradas de guagua en Tenerife reciben un servicio tan escaso
                      que difícilmente pueden considerarse una alternativa real al coche.
                    </p>
                  </div>

                  <div
                    className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8
                                transition-all duration-700
                                ${desertsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <div className="rounded-xl bg-red-accent/10 border border-red-accent/20 p-5 text-center">
                      <p className="font-mono text-3xl font-bold text-red-accent">
                        {fmtEs(desertStats.under5)}
                      </p>
                      <p className="text-sm text-red-accent/80 mt-1">
                        paradas con {'<'} 5 buses/día
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {((desertStats.under5 / desertStats.total) * 100).toFixed(1).replace('.', ',')}% del total
                      </p>
                    </div>

                    <div className="rounded-xl bg-yellow/10 border border-yellow/20 p-5 text-center">
                      <p className="font-mono text-3xl font-bold text-yellow">
                        {fmtEs(desertStats.under10)}
                      </p>
                      <p className="text-sm text-yellow/80 mt-1">
                        paradas con {'<'} 10 buses/día
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {((desertStats.under10 / desertStats.total) * 100).toFixed(1).replace('.', ',')}% del total
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-blue/10 border border-brand-blue/20 p-5 text-center">
                      <p className="font-mono text-3xl font-bold text-brand-blue">
                        {fmtEs(desertStats.under20)}
                      </p>
                      <p className="text-sm text-brand-blue/80 mt-1">
                        paradas con {'<'} 20 buses/día
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {((desertStats.under20 / desertStats.total) * 100).toFixed(1).replace('.', ',')}% del total
                      </p>
                    </div>
                  </div>

                  {/* Distribution bar */}
                  <div
                    className={`rounded-xl bg-brand-card border border-brand-border p-6
                                transition-all duration-700 delay-150
                                ${desertsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <h3 className="text-lg font-semibold mb-1">
                      Distribución de frecuencia de paradas
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Proporción de paradas según su frecuencia diaria de guaguas
                    </p>

                    <div className="space-y-4">
                      {[
                        {
                          label: '< 5 buses/día',
                          count: desertStats.under5,
                          color: '#ef4444',
                        },
                        {
                          label: '5 - 9 buses/día',
                          count: desertStats.under10 - desertStats.under5,
                          color: '#f97316',
                        },
                        {
                          label: '10 - 19 buses/día',
                          count: desertStats.under20 - desertStats.under10,
                          color: '#eab308',
                        },
                        {
                          label: '20+ buses/día',
                          count: desertStats.total - desertStats.under20,
                          color: '#16C79A',
                        },
                      ].map((band) => {
                        const pct = (band.count / desertStats.total) * 100;
                        return (
                          <div key={band.label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-slate-300">{band.label}</span>
                              <span className="text-sm font-mono text-slate-400">
                                {fmtEs(band.count)} ({pct.toFixed(1).replace('.', ',')}%)
                              </span>
                            </div>
                            <div className="h-3 rounded-full bg-brand-surface overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: band.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Section 6: Conclusion ───────────────────────────── */}
            <section
              ref={conclusionRef}
              className="relative py-16"
              aria-label="Conclusión"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

              <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                <div
                  className={`text-center mb-10 transition-all duration-700
                              ${conclusionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                  <p className="text-green font-mono text-sm tracking-widest uppercase mb-3">
                    Conclusión
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                    El transporte público <span className="text-green">no es suficiente</span>
                  </h2>
                  <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    Los datos demuestran que la red de guaguas de Tenerife, pese a su extensión
                    nominal, no ofrece una alternativa viable al vehículo privado para la mayoría
                    de la población.
                  </p>
                </div>

                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4
                              transition-all duration-700 delay-150
                              ${conclusionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                  <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                    <div className="text-2xl mb-3">&#x1F6A8;</div>
                    <h3 className="font-semibold text-white mb-2">Frecuencia insuficiente</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      La mayoría de paradas reciben menos de 10 guaguas al día,
                      haciendo inviable depender del transporte público para
                      desplazamientos cotidianos.
                    </p>
                  </div>

                  <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                    <div className="text-2xl mb-3">&#x1F6E3;&#xFE0F;</div>
                    <h3 className="font-semibold text-white mb-2">Sin carriles exclusivos</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Las rutas de guagua comparten las mismas autopistas congestionadas
                      con el tráfico privado, sin prioridad ni carriles bus-VAO
                      que garanticen tiempos competitivos.
                    </p>
                  </div>

                  <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                    <div className="text-2xl mb-3">&#x1F3DC;&#xFE0F;</div>
                    <h3 className="font-semibold text-white mb-2">Amplios desiertos de transporte</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Grandes zonas de la isla carecen de servicio útil de guaguas,
                      lo que obliga a sus residentes a depender exclusivamente del
                      vehículo privado.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
