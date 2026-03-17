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
  getTramStops,
  getTransitStudy,
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

function formatMillions(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
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
  const { data: tramStopsData, loading: tramStopsLoading, error: tramStopsError, refetch: refetchTramStops } =
    useFetch(getTramStops);
  const { data: study, loading: studyLoading, error: studyError, refetch: refetchStudy } =
    useFetch(getTransitStudy);

  /* Intersection observers for animations */
  const [heroRef, heroVisible] = useIntersection(0.1);
  const [motorRef, motorVisible] = useIntersection(0.1);
  const [combinedRef, combinedVisible] = useIntersection(0.1);
  const [kpiRef, kpiVisible] = useIntersection(0.1);
  const [chartRef, chartVisible] = useIntersection(0.1);
  const [corridorsRef, corridorsVisible] = useIntersection(0.1);
  const [desertsRef, desertsVisible] = useIntersection(0.1);
  const [tramRef, tramVisible] = useIntersection(0.1);
  const [taxiRef, taxiVisible] = useIntersection(0.1);
  const [vtcRef, vtcVisible] = useIntersection(0.1);
  const [compareRef, compareVisible] = useIntersection(0.1);
  const [conclusionRef, conclusionVisible] = useIntersection(0.1);

  /* Corridor accordion state */
  const [openCorridor, setOpenCorridor] = useState<string | null>(null);

  /* ── Derived data ───────────────────────────────────────────── */

  /* Top 10 busiest bus stops for the bar chart */
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

  /* Top 10 busiest tram stops for the bar chart */
  const top10TramStops = useMemo<{ name: string; trams_dia: number }[]>(() => {
    if (!tramStopsData?.stops) return [];
    return [...tramStopsData.stops]
      .filter((s) => s.trams_dia != null && s.trams_dia > 0)
      .sort((a, b) => (b.trams_dia ?? 0) - (a.trams_dia ?? 0))
      .slice(0, 10)
      .reverse()
      .map((s) => ({
        name: s.name.length > 30 ? s.name.slice(0, 28) + '...' : s.name,
        trams_dia: s.trams_dia ?? 0,
      }));
  }, [tramStopsData]);

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

  function getTramColor(trams: number): string {
    if (trams >= 200) return '#16C79A';
    if (trams >= 100) return '#3b82f6';
    if (trams >= 50) return '#8b5cf6';
    return '#a855f7';
  }

  /* Passenger comparison data for chart */
  const passengerComparison = useMemo(() => {
    if (!study) return [];
    return [
      { mode: 'Guaguas (TITSA)', passengers: study.bus_annual_passengers, color: '#16C79A' },
      { mode: 'Tranvía', passengers: study.tram_annual_passengers, color: '#8b5cf6' },
    ];
  }, [study]);

  const isLoading = summaryLoading || stopsLoading || corridorsLoading || tramStopsLoading || studyLoading;
  const hasError = summaryError || stopsError || corridorsError || tramStopsError || studyError;

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      <Header />
      <main>
        {/* ══════════════════════════════════════════════════════════
            Section 1: Hero / Intro
            ══════════════════════════════════════════════════════════ */}
        <section
          ref={heroRef}
          className="relative pt-28 pb-16"
          aria-label="Estudio de Transporte - Introducción"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-surface pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full
                          bg-green/[0.04] blur-3xl pointer-events-none" />

          <div
            className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 text-center
                        transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <p className="text-green font-mono text-sm tracking-widest uppercase mb-3">
              Observatorio de movilidad
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Estudio de <span className="text-green">Transporte</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-2">
              Guaguas, tranvía, taxis y VTC en Tenerife
            </p>
            <p className="text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Un análisis exhaustivo de todas las alternativas de transporte en la isla.
              Guaguas TITSA, el tranvía de Santa Cruz-La Laguna, el sector del taxi
              y los VTC. Los datos revelan que ninguna de estas opciónes ofrece una
              alternativa real al vehículo privado para la mayoría de la población.
            </p>
            <a
              href="https://agentcrew.sh/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full
                         bg-brand-card/60 border border-brand-border/50 text-xs text-slate-400
                         hover:text-white hover:border-brand-border transition-colors"
            >
              Powered by <span className="font-semibold text-slate-300">AgentCrew</span>
            </a>
          </div>
        </section>

        {hasError ? (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
            <ErrorState
              message={summaryError ?? stopsError ?? corridorsError ?? tramStopsError ?? studyError ?? 'Error desconocido'}
              onRetry={() => {
                refetchSummary();
                refetchStops();
                refetchCorridors();
                refetchTramStops();
                refetchStudy();
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
            {/* ══════════════════════════════════════════════════════════
                Section 2: Motorization Index Banner
                ══════════════════════════════════════════════════════════ */}
            {study && (
              <section
                ref={motorRef}
                className="relative py-12"
                aria-label="Índice de motorización"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                  <div
                    className={`rounded-2xl bg-gradient-to-r from-red-accent/10 via-brand-card to-red-accent/10
                                border border-red-accent/20 p-8 sm:p-10 text-center
                                transition-all duration-700
                                ${motorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <p className="text-red-accent font-mono text-sm tracking-widest uppercase mb-4">
                      Índice de motorización
                    </p>
                    <p className="text-6xl sm:text-7xl font-bold font-mono text-white mb-2">
                      {study.motorization_index.toFixed(0).replace('.', ',')}
                    </p>
                    <p className="text-xl text-slate-300 mb-4">
                      vehículos por cada 1.000 habitantes
                    </p>
                    <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
                      Con {fmtEs(study.population)} residentes y {fmtEs(study.annual_tourists)} turistas
                      anuales, Tenerife tiene uno de los índices de motorización másaltos de Europa.
                      La dependencia del coche es estructural, no una eleccion.
                    </p>
                    <p className="text-xs text-slate-500 mt-4">
                      Fuente: DGT / ISTAC / Cabildo de Tenerife
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ══════════════════════════════════════════════════════════
                Section 3: Combined KPI Cards — All Modes Overview
                ══════════════════════════════════════════════════════════ */}
            {study && (
              <section
                ref={combinedRef}
                className="relative py-12"
                aria-label="Resumen de todos los modos de transporte"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-bg to-brand-surface pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                  <div className="mb-8">
                    <p className="text-green font-mono text-sm tracking-widest uppercase mb-3">
                      Vision general
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                      Todos los modos de <span className="text-green">transporte</span>
                    </h2>
                  </div>

                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
                                transition-all duration-700
                                ${combinedVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Pasajeros transporte público / año
                      </p>
                      <p className="text-3xl font-bold font-mono text-green">
                        {formatMillions(study.total_public_transport_passengers)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatMillions(study.bus_annual_passengers)} bus + {formatMillions(study.tram_annual_passengers)} tranvía
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Red de guaguas
                      </p>
                      <p className="text-3xl font-bold font-mono text-white">
                        {fmtEs(study.bus_stops)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        paradas · {fmtEs(study.bus_routes)} rutas
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Red de tranvía
                      </p>
                      <p className="text-3xl font-bold font-mono text-white">
                        {fmtEs(study.tram_stops)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        paradas · {study.tram_routes} rutas · {study.tram_network_km.toFixed(1).replace('.', ',')} km
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Índice motorización
                      </p>
                      <p className="text-3xl font-bold font-mono text-red-accent">
                        {study.motorization_index.toFixed(0).replace('.', ',')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        vehículos / 1.000 hab.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ══════════════════════════════════════════════════════════
                Section 4: Guaguas TITSA — KPIs
                ══════════════════════════════════════════════════════════ */}
            {summary && (
              <section
                ref={kpiRef}
                className="relative py-12"
                aria-label="Resumen guaguas TITSA"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                  <div className="mb-8">
                    <p className="text-green font-mono text-sm tracking-widest uppercase mb-3">
                      Guaguas TITSA
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                      Red de <span className="text-green">autobus</span>
                    </h2>
                    <p className="text-slate-300 max-w-2xl">
                      La red de guaguas de TITSA es el principal medio de transporte público
                      de Tenerife. Pese a su extension, la frecuencia es insuficiente para
                      la mayoría de paradas.
                    </p>
                  </div>

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
                        lineas de guagua activas
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
                        Rutas en vias congestionadas
                      </p>
                      <p className="text-3xl font-bold font-mono text-green">
                        {fmtEs(summary.routes_on_congested_roads)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        comparten autopista con miles de coches
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-4">
                    Fuente: TITSA GTFS / Cabildo de Tenerife
                  </p>
                </div>
              </section>
            )}

            {/* ══════════════════════════════════════════════════════════
                Section 5: Top 10 Busiest Bus Stops
                ══════════════════════════════════════════════════════════ */}
            {top10Stops.length > 0 && (
              <section
                ref={chartRef}
                className="relative py-12"
                aria-label="Top 10 paradas de guagua más frecuentadas"
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
                      Top 10 paradas de guagua más frecuentadas
                    </h2>
                    <p className="text-xs text-slate-400 mb-6">
                      Paradas con mayor numero de guaguas diarias · Fuente: TITSA / Cabildo de Tenerife
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

            {/* ══════════════════════════════════════════════════════════
                Section 6: Congested Corridors
                ══════════════════════════════════════════════════════════ */}
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
                      y solo un punado de lineas de guagua. Las rutas de autobus compiten
                      directamente con el trafico privado sin carriles exclusivos.
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
                                  Proporcion buses vs coches (representacion visual)
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
                                  <span>Vehiculos privados</span>
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

            {/* ══════════════════════════════════════════════════════════
                Section 7: Transport Deserts
                ══════════════════════════════════════════════════════════ */}
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
                      que dificilmente pueden considerarse una alternativa real al coche.
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
                      Distribucion de frecuencia de paradas
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Proporcion de paradas segun su frecuencia diaria de guaguas
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

            {/* ══════════════════════════════════════════════════════════
                Section 8: Tranvía (Tram)
                ══════════════════════════════════════════════════════════ */}
            {study && (
              <section
                ref={tramRef}
                className="relative py-12"
                aria-label="Tranvía de Tenerife"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                  <div className="mb-8">
                    <p className="text-[#8b5cf6] font-mono text-sm tracking-widest uppercase mb-3">
                      Tranvía de Tenerife
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                      Linea 1 y 2: Santa Cruz <span className="text-[#8b5cf6]">↔</span> La Laguna
                    </h2>
                    <p className="text-slate-300 max-w-2xl">
                      El unico sistema de transporte guiado de la isla. Solo cubre el corredor
                      metropolitano Santa Cruz – La Laguna en {study.tram_network_km.toFixed(1).replace('.', ',')} km,
                      mientras que Tenerife tiene 2.034 km&sup2; de superficie.
                    </p>
                  </div>

                  {/* Tram KPI cards */}
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8
                                transition-all duration-700
                                ${tramVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Paradas
                      </p>
                      <p className="text-3xl font-bold font-mono text-white">
                        {fmtEs(study.tram_stops)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Lineas
                      </p>
                      <p className="text-3xl font-bold font-mono text-white">
                        {study.tram_routes}
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Media tranvías/día
                      </p>
                      <p className="text-3xl font-bold font-mono text-white">
                        {study.tram_avg_frequency.toFixed(0)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Red (km)
                      </p>
                      <p className="text-3xl font-bold font-mono text-white">
                        {study.tram_network_km.toFixed(1).replace('.', ',')}
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Pasajeros / año
                      </p>
                      <p className="text-3xl font-bold font-mono text-[#8b5cf6]">
                        {formatMillions(study.tram_annual_passengers)}
                      </p>
                    </div>
                  </div>

                  {/* Top 10 tram stops chart */}
                  {top10TramStops.length > 0 && (
                    <div
                      className={`rounded-xl bg-brand-card border border-brand-border p-6 mb-8
                                  transition-all duration-700 delay-150
                                  ${tramVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                    >
                      <h3 className="text-lg font-semibold mb-1">
                        Top 10 paradas de tranvía más frecuentadas
                      </h3>
                      <p className="text-xs text-slate-400 mb-6">
                        Paradas con mayor numero de tranvías diarios · Fuente: Metrotenerife / Cabildo de Tenerife
                      </p>

                      <div className="h-[400px] sm:h-[440px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={top10TramStops}
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
                              cursor={{ fill: 'rgba(139, 92, 246, 0.08)' }}
                              formatter={(value: number) => [
                                fmtEs(value) + ' tranvías/día',
                                'Frecuencia',
                              ]}
                            />
                            <Bar dataKey="trams_dia" radius={[0, 6, 6, 0]} barSize={18}>
                              {top10TramStops.map((entry, i) => (
                                <Cell key={i} fill={getTramColor(entry.trams_dia)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Key insight card */}
                  <div
                    className={`rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 p-6
                                transition-all duration-700 delay-300
                                ${tramVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <h3 className="font-semibold text-[#8b5cf6] mb-2">
                      Dato clave
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      El tranvía solo cubre el corredor Santa Cruz ↔ La Laguna:
                      {' '}<span className="font-mono font-bold text-white">{study.tram_network_km.toFixed(1).replace('.', ',')}</span> km
                      de via frente a una isla de <span className="font-mono font-bold text-white">2.034</span> km&sup2;.
                      Eso supone menos del <span className="font-mono font-bold text-white">1%</span> del territorio.
                      Para el resto de la isla, el tranvía simplemente no existe como opción.
                    </p>
                    <p className="text-xs text-slate-500 mt-3">
                      Fuente: Metrotenerife / Cabildo de Tenerife
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ══════════════════════════════════════════════════════════
                Section 9: Taxis
                ══════════════════════════════════════════════════════════ */}
            {study && (
              <section
                ref={taxiRef}
                className="relative py-12"
                aria-label="Sector del taxi"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-bg to-brand-surface pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                  <div className="mb-8">
                    <p className="text-[#eab308] font-mono text-sm tracking-widest uppercase mb-3">
                      Sector del taxi
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                      Taxis en <span className="text-[#eab308]">Tenerife</span>
                    </h2>
                    <p className="text-slate-300 max-w-2xl">
                      Un sector regulado con licencias limitadas, en declive demografico y
                      con una adaptación mínima para personas con movilidad reducida.
                    </p>
                  </div>

                  <div
                    className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8
                                transition-all duration-700
                                ${taxiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <div className="rounded-xl bg-brand-card border border-brand-border p-5 text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Licencias Canarias
                      </p>
                      <p className="text-4xl font-bold font-mono text-[#eab308]">
                        {fmtEs(study.taxi_licenses_canarias)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        taxis en todo el archipielago
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5 text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Licencias SC Tenerife
                      </p>
                      <p className="text-4xl font-bold font-mono text-[#eab308]">
                        ~{fmtEs(study.taxi_licenses_sc_tenerife)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        taxis en la provincia
                      </p>
                    </div>

                    <div className="rounded-xl bg-red-accent/10 border border-red-accent/20 p-5 text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Taxis adaptados PMR
                      </p>
                      <p className="text-4xl font-bold font-mono text-red-accent">
                        {study.taxi_adapted_pmr}
                      </p>
                      <p className="text-xs text-red-accent/60 mt-1">
                        de ~{fmtEs(study.taxi_licenses_sc_tenerife)} en la provincia
                      </p>
                    </div>
                  </div>

                  {/* Adapted ratio visual */}
                  <div
                    className={`rounded-xl bg-brand-card border border-brand-border p-6 mb-6
                                transition-all duration-700 delay-150
                                ${taxiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <h3 className="text-lg font-semibold mb-3">
                      Accesibilidad: taxis adaptados vs total
                    </h3>
                    <div className="h-4 rounded-full overflow-hidden bg-brand-surface flex mb-2">
                      <div
                        className="h-full rounded-l-full"
                        style={{
                          width: `${Math.max(1.5, (study.taxi_adapted_pmr / study.taxi_licenses_sc_tenerife) * 100)}%`,
                          backgroundColor: '#16C79A',
                        }}
                      />
                      <div
                        className="h-full flex-1 rounded-r-full"
                        style={{ backgroundColor: '#334155' }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>
                        <span className="text-green font-mono font-bold">{study.taxi_adapted_pmr}</span> adaptados PMR
                        ({((study.taxi_adapted_pmr / study.taxi_licenses_sc_tenerife) * 100).toFixed(1).replace('.', ',')}%)
                      </span>
                      <span>~{fmtEs(study.taxi_licenses_sc_tenerife)} total</span>
                    </div>
                  </div>

                  {/* Insight */}
                  <div
                    className={`rounded-xl bg-[#eab308]/10 border border-[#eab308]/20 p-6
                                transition-all duration-700 delay-300
                                ${taxiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <h3 className="font-semibold text-[#eab308] mb-2">
                      Dato clave
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      El Plan de Rescate del Taxi autorizo solo <span className="font-mono font-bold text-white">151</span> nuevas
                      licencias. El sector enfrenta envejecimiento de la flota y de los conductores, y solo
                      <span className="font-mono font-bold text-white"> {study.taxi_adapted_pmr}</span> vehículos
                      estan adaptados para personas con movilidad reducida — un <span className="font-mono font-bold text-white">
                      {((study.taxi_adapted_pmr / study.taxi_licenses_sc_tenerife) * 100).toFixed(1).replace('.', ',')}%
                      </span> del total.
                    </p>
                    <p className="text-xs text-slate-500 mt-3">
                      Fuente: Gobierno de Canarias / Cabildo de Tenerife
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ══════════════════════════════════════════════════════════
                Section 10: VTC
                ══════════════════════════════════════════════════════════ */}
            {study && (
              <section
                ref={vtcRef}
                className="relative py-12"
                aria-label="VTC en Tenerife"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                  <div className="mb-8">
                    <p className="text-red-accent font-mono text-sm tracking-widest uppercase mb-3">
                      VTC — Vehículo de turismo con conductor
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                      No hay alternativa <span className="text-red-accent">digital</span> al taxi
                    </h2>
                    <p className="text-slate-300 max-w-2xl">
                      Mientras en el resto de Europa los VTC (Uber, Cabify, Bolt...) son una
                      alternativa real, en Tenerife estan practicamente bloqueados.
                    </p>
                  </div>

                  {/* Big dramatic number */}
                  <div
                    className={`rounded-2xl bg-gradient-to-r from-red-accent/10 via-brand-card to-red-accent/10
                                border border-red-accent/20 p-8 sm:p-10 text-center mb-8
                                transition-all duration-700
                                ${vtcVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <p className="text-7xl sm:text-8xl font-bold font-mono text-red-accent mb-3">
                      {study.vtc_licenses_active}
                    </p>
                    <p className="text-xl text-slate-300 mb-2">
                      licencias VTC activas en toda la isla
                    </p>
                    <p className="text-slate-400 text-sm max-w-xl mx-auto">
                      Para una isla con {fmtEs(study.population)} residentes y {fmtEs(study.annual_tourists)} turistas anuales
                    </p>
                  </div>

                  {/* VTC detail cards */}
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8
                                transition-all duration-700 delay-150
                                ${vtcVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Operador unico
                      </p>
                      <p className="text-2xl font-bold font-mono text-white">
                        {study.vtc_operator}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        sin competencia
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Cobertura
                      </p>
                      <p className="text-sm font-medium text-white leading-snug">
                        {study.vtc_coverage}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        solo zona sur
                      </p>
                    </div>

                    <div className="rounded-xl bg-red-accent/10 border border-red-accent/20 p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Solicitudes bloqueadas
                      </p>
                      <p className="text-2xl font-bold font-mono text-red-accent">
                        {fmtEs(study.vtc_blocked_applications)}
                      </p>
                      <p className="text-xs text-red-accent/60 mt-1">
                        licencias denegadas o en espera
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Estado regulatorio
                      </p>
                      <p className="text-2xl font-bold font-mono text-[#eab308]">
                        Moratoria
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        sin nuevas licencias
                      </p>
                    </div>
                  </div>

                  {/* Insight */}
                  <div
                    className={`rounded-xl bg-red-accent/10 border border-red-accent/20 p-6
                                transition-all duration-700 delay-300
                                ${vtcVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <h3 className="font-semibold text-red-accent mb-2">
                      Dato clave
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      Solo <span className="font-mono font-bold text-white">{study.vtc_licenses_active}</span> licencias
                      VTC activas frente a <span className="font-mono font-bold text-white">{fmtEs(study.vtc_blocked_applications)}</span> solicitudes
                      bloqueadas. Solo opera <span className="font-mono font-bold text-white">{study.vtc_operator}</span>,
                      unicamente en la zona sur. En Santa Cruz, La Laguna y el norte de la isla,
                      no existe ningun servicio VTC. La moratoria impide cualquier crecimiento.
                    </p>
                    <p className="text-xs text-slate-500 mt-3">
                      Fuente: Gobierno de Canarias / CNMC
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ══════════════════════════════════════════════════════════
                Section 11: Comparative Summary
                ══════════════════════════════════════════════════════════ */}
            {study && (
              <section
                ref={compareRef}
                className="relative py-12"
                aria-label="Comparativa de modos de transporte"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-bg to-brand-surface pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                  <div className="mb-8">
                    <p className="text-green font-mono text-sm tracking-widest uppercase mb-3">
                      Comparativa
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                      Todos los modos, <span className="text-green">cara a cara</span>
                    </h2>
                    <p className="text-slate-300 max-w-2xl">
                      Una vista comparada de todas las alternativas de transporte disponibles
                      en Tenerife y su capacidad real para mover a la población.
                    </p>
                  </div>

                  {/* Passengers by mode chart */}
                  <div
                    className={`rounded-xl bg-brand-card border border-brand-border p-6 mb-8
                                transition-all duration-700
                                ${compareVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <h3 className="text-lg font-semibold mb-1">
                      Pasajeros anuales por modo de transporte público
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">
                      Solo guaguas y tranvía mueven pasajeros a escala · Fuente: TITSA / Metrotenerife
                    </p>

                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={passengerComparison}
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
                            tickFormatter={formatMillions}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            axisLine={{ stroke: '#334155' }}
                          />
                          <YAxis
                            type="category"
                            dataKey="mode"
                            width={160}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            axisLine={{ stroke: '#334155' }}
                          />
                          <Tooltip
                            {...DARK_TOOLTIP}
                            cursor={{ fill: 'rgba(22, 199, 154, 0.08)' }}
                            formatter={(value: number) => [
                              fmtEs(value) + ' pasajeros/año',
                              'Pasajeros',
                            ]}
                          />
                          <Bar dataKey="passengers" radius={[0, 6, 6, 0]} barSize={24}>
                            {passengerComparison.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Mode comparison cards */}
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
                                transition-all duration-700 delay-150
                                ${compareVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    {/* Bus */}
                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-block w-3 h-3 rounded-full bg-[#16C79A]" />
                        <p className="text-sm font-semibold text-white">Guaguas TITSA</p>
                      </div>
                      <p className="font-mono text-2xl font-bold text-[#16C79A]">
                        {formatMillions(study.bus_annual_passengers)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">pasajeros/año</p>
                      <div className="mt-3 pt-3 border-t border-brand-border/50 text-xs text-slate-400 space-y-1">
                        <p>{fmtEs(study.bus_stops)} paradas</p>
                        <p>{fmtEs(study.bus_routes)} rutas</p>
                        <p>Toda la isla</p>
                      </div>
                    </div>

                    {/* Tram */}
                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-block w-3 h-3 rounded-full bg-[#8b5cf6]" />
                        <p className="text-sm font-semibold text-white">Tranvía</p>
                      </div>
                      <p className="font-mono text-2xl font-bold text-[#8b5cf6]">
                        {formatMillions(study.tram_annual_passengers)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">pasajeros/año</p>
                      <div className="mt-3 pt-3 border-t border-brand-border/50 text-xs text-slate-400 space-y-1">
                        <p>{fmtEs(study.tram_stops)} paradas</p>
                        <p>{study.tram_routes} lineas</p>
                        <p>Solo SC ↔ La Laguna ({study.tram_network_km.toFixed(1).replace('.', ',')} km)</p>
                      </div>
                    </div>

                    {/* Taxi */}
                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-block w-3 h-3 rounded-full bg-[#eab308]" />
                        <p className="text-sm font-semibold text-white">Taxis</p>
                      </div>
                      <p className="font-mono text-2xl font-bold text-[#eab308]">
                        ~{fmtEs(study.taxi_licenses_sc_tenerife)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">licencias</p>
                      <div className="mt-3 pt-3 border-t border-brand-border/50 text-xs text-slate-400 space-y-1">
                        <p>{study.taxi_adapted_pmr} adaptados PMR</p>
                        <p>Sector regulado</p>
                        <p>Toda la isla</p>
                      </div>
                    </div>

                    {/* VTC */}
                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-accent" />
                        <p className="text-sm font-semibold text-white">VTC ({study.vtc_operator})</p>
                      </div>
                      <p className="font-mono text-2xl font-bold text-red-accent">
                        {study.vtc_licenses_active}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">licencias</p>
                      <div className="mt-3 pt-3 border-t border-brand-border/50 text-xs text-slate-400 space-y-1">
                        <p>{fmtEs(study.vtc_blocked_applications)} bloqueadas</p>
                        <p>Moratoria activa</p>
                        <p>Solo zona sur</p>
                      </div>
                    </div>
                  </div>

                  {/* The gap */}
                  <div
                    className={`mt-8 rounded-xl bg-brand-card border border-brand-border p-6
                                transition-all duration-700 delay-300
                                ${compareVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <h3 className="text-lg font-semibold mb-3">
                      La brecha estructural
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Población + turistas</p>
                        <p className="font-mono text-2xl font-bold text-white">
                          {formatMillions(study.population + study.annual_tourists)}
                        </p>
                        <p className="text-xs text-slate-500">personas a mover anualmente</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Transporte público</p>
                        <p className="font-mono text-2xl font-bold text-green">
                          {formatMillions(study.total_public_transport_passengers)}
                        </p>
                        <p className="text-xs text-slate-500">viajes/año (bus + tranvía)</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Resultado</p>
                        <p className="font-mono text-2xl font-bold text-red-accent">
                          {study.motorization_index.toFixed(0)}/1.000
                        </p>
                        <p className="text-xs text-slate-500">vehículos por habitante</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-4">
                      Fuente: DGT / ISTAC / TITSA / Metrotenerife / Gobierno de Canarias
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ══════════════════════════════════════════════════════════
                Section 12: Conclusion
                ══════════════════════════════════════════════════════════ */}
            <section
              ref={conclusionRef}
              className="relative py-16"
              aria-label="Conclusion"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

              <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                <div
                  className={`text-center mb-10 transition-all duration-700
                              ${conclusionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                  <p className="text-green font-mono text-sm tracking-widest uppercase mb-3">
                    Conclusion
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                    Ninguna alternativa es <span className="text-green">suficiente</span>
                  </h2>
                  <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    Los datos de todos los modos de transporte demuestran que Tenerife carece
                    de una alternativa real al vehículo privado. Guaguas con baja frecuencia,
                    un tranvía que solo cubre un corredor, un sector del taxi en declive y
                    los VTC practicamente prohibidos.
                  </p>
                </div>

                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10
                              transition-all duration-700 delay-150
                              ${conclusionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                  <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                    <div className="text-2xl mb-3">&#x1F68C;</div>
                    <h3 className="font-semibold text-white mb-2">Guaguas: frecuencia insuficiente</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      La mayoría de paradas reciben menos de 10 guaguas al día.
                      Las rutas comparten autopistas congestionadas sin carriles exclusivos.
                      Amplios desiertos de transporte en toda la isla.
                    </p>
                  </div>

                  <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                    <div className="text-2xl mb-3">&#x1F683;</div>
                    <h3 className="font-semibold text-white mb-2">Tranvía: cobertura mínima</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Solo {study?.tram_network_km.toFixed(1).replace('.', ',')} km de via para una isla de 2.034 km&sup2;.
                      Unicamente conecta Santa Cruz con La Laguna. Para el 95% de la isla,
                      el tranvía no existe.
                    </p>
                  </div>

                  <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                    <div className="text-2xl mb-3">&#x1F695;</div>
                    <h3 className="font-semibold text-white mb-2">Taxi y VTC: bloqueados</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Solo {study?.taxi_adapted_pmr} taxis adaptados PMR. Los VTC estan
                      limitados a {study?.vtc_licenses_active} licencias con moratoria activa.
                      No hay alternativa digital viable al taxi.
                    </p>
                  </div>
                </div>

                {/* Final verdict */}
                {study?.alternatives_verdict && (
                  <div
                    className={`rounded-2xl bg-gradient-to-r from-green/10 via-brand-card to-green/10
                                border border-green/20 p-8 text-center
                                transition-all duration-700 delay-300
                                ${conclusionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  >
                    <p className="text-green font-mono text-xs tracking-widest uppercase mb-4">
                      Veredicto de los datos
                    </p>
                    <p className="text-lg sm:text-xl text-slate-200 leading-relaxed max-w-3xl mx-auto italic">
                      &ldquo;{study.alternatives_verdict}&rdquo;
                    </p>
                    <p className="text-xs text-slate-500 mt-4">
                      Fuente: Análisis cruzado de datos de TITSA, Metrotenerife, DGT, ISTAC, Gobierno de Canarias y CNMC
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
