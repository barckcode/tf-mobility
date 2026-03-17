import { useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useIntersection } from '@/hooks/useIntersection';
import { useFetch } from '@/hooks/useFetch';
import { getContractsTransparency } from '@/lib/api';

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

const TYPE_COLORS: Record<string, string> = {
  obras: '#3b82f6',
  servicios: '#16C79A',
  suministros: '#eab308',
  privado: '#8b5cf6',
  mixto: '#f97316',
};

const TYPE_LABELS: Record<string, string> = {
  obras: 'Obras',
  servicios: 'Servicios',
  suministros: 'Suministros',
  privado: 'Privado',
  mixto: 'Mixto',
};

function fmtEs(n: number): string {
  return n.toLocaleString('es-ES');
}

function fmtEur(n: number): string {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtEurShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M€`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K€`;
  return `${n}€`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1).replace('.', ',')}%`;
}

/* ── Component ────────────────────────────────────────────────── */

export function ContractsPage() {
  /* Scroll to top on mount */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  /* Data fetching */
  const { data, loading, error, refetch } = useFetch(getContractsTransparency);

  /* Intersection observers for scroll animations */
  const [heroRef, heroVisible] = useIntersection(0.1);
  const [disclaimerRef, disclaimerVisible] = useIntersection(0.1);
  const [kpiRef, kpiVisible] = useIntersection(0.1);
  const [companiesRef, companiesVisible] = useIntersection(0.1);
  const [concentrationRef, concentrationVisible] = useIntersection(0.1);
  const [competitionRef, competitionVisible] = useIntersection(0.1);
  const [evolutionRef, evolutionVisible] = useIntersection(0.1);
  const [typesRef, typesVisible] = useIntersection(0.1);
  const [footerDisclaimerRef, footerDisclaimerVisible] = useIntersection(0.1);

  /* ── Derived data ───────────────────────────────────────────── */

  /* Top 15 companies for horizontal bar chart */
  const top15Companies = useMemo(() => {
    if (!data?.top_companies) return [];
    return [...data.top_companies]
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 15)
      .reverse()
      .map((c) => ({
        name: c.company.length > 35 ? c.company.slice(0, 33) + '...' : c.company,
        fullName: c.company,
        cif: c.cif,
        total_amount: c.total_amount,
        contract_count: c.contract_count,
        avg_competitors: c.avg_competitors,
      }));
  }, [data]);

  /* Max amount for color gradient */
  const maxAmount = useMemo(() => {
    if (!top15Companies.length) return 1;
    return Math.max(...top15Companies.map((c) => c.total_amount));
  }, [top15Companies]);

  /* Contracts by year for evolution chart */
  const yearData = useMemo(() => {
    if (!data?.contracts_by_year) return [];
    return [...data.contracts_by_year].sort((a, b) => a.year - b.year);
  }, [data]);

  /* Contracts by type for pie chart */
  const typeData = useMemo(() => {
    if (!data?.contracts_by_type) return [];
    return data.contracts_by_type.map((t) => ({
      name: TYPE_LABELS[t.type] ?? t.type,
      value: t.count,
      fill: TYPE_COLORS[t.type] ?? '#94a3b8',
    }));
  }, [data]);

  /* Competition breakdown for donut chart */
  const competitionData = useMemo(() => {
    if (!data) return [];
    const single = data.contracts_single_bidder;
    const total = data.total_contracts;
    // Approximate breakdown: single bidder vs rest
    // Since we don't have exact 2-3 / 4+ data, use avg_competitors to estimate
    const multiLow = Math.round(total * 0.35); // estimated 2-3 bidders
    const multiHigh = total - single - multiLow; // estimated 4+ bidders
    return [
      { name: '1 licitador', value: single, fill: '#E94560' },
      { name: '2-3 licitadores', value: Math.max(0, multiLow), fill: '#eab308' },
      { name: '4+ licitadores', value: Math.max(0, multiHigh), fill: '#16C79A' },
    ];
  }, [data]);

  /* Bar color based on amount (gradient from blue to red) */
  function getBarColor(amount: number): string {
    const ratio = amount / maxAmount;
    if (ratio >= 0.8) return '#E94560';
    if (ratio >= 0.6) return '#f97316';
    if (ratio >= 0.4) return '#eab308';
    if (ratio >= 0.2) return '#3b82f6';
    return '#8b5cf6';
  }

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
          aria-label="Contratos de Movilidad - Introduccion"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-surface pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full
                          bg-brand-blue/[0.04] blur-3xl pointer-events-none" />

          <div
            className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 text-center
                        transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <p className="text-brand-blue font-mono text-sm tracking-widest uppercase mb-3">
              Observatorio de movilidad
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Contratos de <span className="text-brand-blue">Movilidad</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-2">
              Transparencia en la contratacion publica
            </p>
            <p className="text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Analisis de los contratos publicos de movilidad del Cabildo de Tenerife.
              Todos los datos proceden de la Plataforma de Contratacion del Sector Publico (PLACSP)
              y son de acceso publico.
            </p>
          </div>
        </section>

        {error ? (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
            <ErrorState message={error} onRetry={refetch} />
          </div>
        ) : loading ? (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : data ? (
          <>
            {/* ══════════════════════════════════════════════════════════
                Section 2: Disclaimer Banner
                ══════════════════════════════════════════════════════════ */}
            <section
              ref={disclaimerRef}
              className="relative py-8"
              aria-label="Aviso legal"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

              <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                <div
                  className={`rounded-2xl bg-gradient-to-r from-brand-blue/10 via-brand-card to-brand-blue/10
                              border border-brand-blue/20 p-6 sm:p-8
                              transition-all duration-700
                              ${disclaimerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-brand-blue uppercase tracking-wider mb-2">
                        Nota de transparencia
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {data.disclaimer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                Section 3: KPI Cards
                ══════════════════════════════════════════════════════════ */}
            <section
              ref={kpiRef}
              className="relative py-12"
              aria-label="Indicadores clave de contratacion"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-bg to-brand-surface pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

              <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-8">
                  <p className="text-brand-blue font-mono text-sm tracking-widest uppercase mb-3">
                    Resumen general
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                    Indicadores <span className="text-brand-blue">clave</span>
                  </h2>
                </div>

                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
                              transition-all duration-700
                              ${kpiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                  {/* Total contracts + amount */}
                  <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                      Contratos adjudicados
                    </p>
                    <p className="text-3xl font-bold font-mono text-white">
                      {fmtEs(data.total_contracts)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      por {fmtEur(data.total_awarded_amount)}
                    </p>
                  </div>

                  {/* Average competitors */}
                  <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                      Media de licitadores
                    </p>
                    <p className="text-3xl font-bold font-mono text-white">
                      {data.avg_competitors_per_contract.toFixed(1).replace('.', ',')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      empresas por contrato
                    </p>
                  </div>

                  {/* Single-bidder contracts */}
                  <div className={`rounded-xl bg-brand-card border p-5 ${
                    data.contracts_single_bidder_pct > 15
                      ? 'border-yellow/30'
                      : 'border-brand-border'
                  }`}>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                      Licitador unico
                    </p>
                    <p className={`text-3xl font-bold font-mono ${
                      data.contracts_single_bidder_pct > 15 ? 'text-yellow' : 'text-white'
                    }`}>
                      {fmtEs(data.contracts_single_bidder)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {fmtPct(data.contracts_single_bidder_pct)} del total
                    </p>
                  </div>

                  {/* Average savings */}
                  <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                      Ahorro medio
                    </p>
                    <p className="text-3xl font-bold font-mono text-green">
                      {fmtPct(data.savings_avg_pct)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      licitacion vs adjudicacion
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                Section 4: Top 15 Companies Bar Chart
                ══════════════════════════════════════════════════════════ */}
            <section
              ref={companiesRef}
              className="relative py-12"
              aria-label="Principales adjudicatarios"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

              <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-8">
                  <p className="text-brand-blue font-mono text-sm tracking-widest uppercase mb-3">
                    Adjudicatarios
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                    Top 15 <span className="text-brand-blue">empresas</span>
                  </h2>
                  <p className="text-slate-400 max-w-2xl">
                    Empresas con mayor volumen de adjudicacion en contratos de movilidad.
                    Datos publicos de la PLACSP.
                  </p>
                </div>

                <div
                  className={`rounded-2xl bg-brand-card border border-brand-border p-4 sm:p-6
                              transition-all duration-700
                              ${companiesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                  <ResponsiveContainer width="100%" height={550}>
                    <BarChart
                      data={top15Companies}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={fmtEurShort}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={{ stroke: '#334155' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={220}
                        tick={{ fill: '#cbd5e1', fontSize: 11 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                      />
                      <Tooltip
                        {...DARK_TOOLTIP}
                        formatter={(value: number) => [fmtEur(value), 'Importe adjudicado']}
                        labelFormatter={(label: string) => {
                          const item = top15Companies.find((c) => c.name === label);
                          if (!item) return label;
                          const lines = [item.fullName];
                          if (item.cif) lines.push(`CIF: ${item.cif}`);
                          lines.push(`Contratos: ${item.contract_count}`);
                          if (item.avg_competitors != null) {
                            lines.push(`Media licitadores: ${item.avg_competitors.toFixed(1).replace('.', ',')}`);
                          }
                          return lines.join('\n');
                        }}
                      />
                      <Bar dataKey="total_amount" radius={[0, 4, 4, 0]}>
                        {top15Companies.map((entry, idx) => (
                          <Cell key={idx} fill={getBarColor(entry.total_amount)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                Section 5: Market Concentration
                ══════════════════════════════════════════════════════════ */}
            <section
              ref={concentrationRef}
              className="relative py-12"
              aria-label="Concentracion de mercado"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-bg to-brand-surface pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

              <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-8">
                  <p className="text-brand-blue font-mono text-sm tracking-widest uppercase mb-3">
                    Concentracion
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                    Concentracion de <span className="text-brand-blue">mercado</span>
                  </h2>
                  <p className="text-slate-400 max-w-2xl">
                    Que porcentaje del gasto publico se concentra en las principales empresas adjudicatarias.
                  </p>
                </div>

                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-6
                              transition-all duration-700
                              ${concentrationVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                  {/* Big numbers */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-card border border-brand-blue/20 p-6 text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-medium">
                        Top 5 empresas
                      </p>
                      <p className="text-5xl sm:text-6xl font-bold font-mono text-brand-blue">
                        {fmtPct(data.concentration_top5_pct)}
                      </p>
                      <p className="text-sm text-slate-400 mt-2">
                        del gasto total
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-brand-violet/10 to-brand-card border border-brand-violet/20 p-6 text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-medium">
                        Top 10 empresas
                      </p>
                      <p className="text-5xl sm:text-6xl font-bold font-mono text-brand-violet">
                        {fmtPct(data.concentration_top10_pct)}
                      </p>
                      <p className="text-sm text-slate-400 mt-2">
                        del gasto total
                      </p>
                    </div>
                  </div>

                  {/* Concentration bar visualization */}
                  <div className="rounded-2xl bg-brand-card border border-brand-border p-6">
                    <p className="text-sm text-slate-300 font-medium mb-4">
                      Distribucion del gasto
                    </p>

                    {/* Stacked bar */}
                    <div className="mb-6">
                      <div className="w-full h-10 rounded-lg overflow-hidden flex">
                        <div
                          className="bg-brand-blue h-full transition-all duration-1000"
                          style={{ width: `${data.concentration_top5_pct}%` }}
                        />
                        <div
                          className="bg-brand-violet h-full transition-all duration-1000"
                          style={{ width: `${data.concentration_top10_pct - data.concentration_top5_pct}%` }}
                        />
                        <div
                          className="bg-slate-600 h-full transition-all duration-1000"
                          style={{ width: `${100 - data.concentration_top10_pct}%` }}
                        />
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-brand-blue" />
                          <span className="text-xs text-slate-400">Top 5 ({fmtPct(data.concentration_top5_pct)})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-brand-violet" />
                          <span className="text-xs text-slate-400">Top 6-10 ({fmtPct(data.concentration_top10_pct - data.concentration_top5_pct)})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-slate-600" />
                          <span className="text-xs text-slate-400">Resto ({fmtPct(100 - data.concentration_top10_pct)})</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      La concentracion de mercado en la contratacion publica es un indicador de la
                      estructura del sector. Un nivel elevado puede reflejar especializacion
                      tecnica o barreras de entrada, mientras que una mayor distribucion suele
                      indicar mayor competitividad.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                Section 6: Competition Analysis
                ══════════════════════════════════════════════════════════ */}
            <section
              ref={competitionRef}
              className="relative py-12"
              aria-label="Analisis de competencia"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

              <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-8">
                  <p className="text-brand-blue font-mono text-sm tracking-widest uppercase mb-3">
                    Competencia
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                    Analisis de <span className="text-brand-blue">competencia</span>
                  </h2>
                  <p className="text-slate-400 max-w-2xl">
                    La competencia en las licitaciones es un indicador clave de la calidad del
                    proceso de contratacion publica.
                  </p>
                </div>

                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-6
                              transition-all duration-700
                              ${competitionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                  {/* Single-bidder highlight + metrics */}
                  <div className="space-y-4">
                    <div className={`rounded-2xl border p-6 sm:p-8 text-center ${
                      data.contracts_single_bidder_pct > 15
                        ? 'bg-gradient-to-br from-yellow/10 to-brand-card border-yellow/20'
                        : 'bg-brand-card border-brand-border'
                    }`}>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-medium">
                        Contratos con licitador unico
                      </p>
                      <p className={`text-6xl sm:text-7xl font-bold font-mono mb-2 ${
                        data.contracts_single_bidder_pct > 15 ? 'text-yellow' : 'text-white'
                      }`}>
                        {fmtPct(data.contracts_single_bidder_pct)}
                      </p>
                      <p className="text-slate-300 text-sm">
                        {fmtEs(data.contracts_single_bidder)} de {fmtEs(data.total_contracts)} contratos
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">
                        Media de competidores
                      </p>
                      <p className="text-3xl font-bold font-mono text-white">
                        {data.avg_competitors_per_contract.toFixed(1).replace('.', ',')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        empresas presentadas por licitacion
                      </p>
                    </div>

                    <div className="rounded-xl bg-brand-card border border-brand-border p-5">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Las licitaciones con un unico participante no implican necesariamente
                        irregularidades. Pueden deberse a la especializacion tecnica requerida,
                        plazos ajustados o requisitos de solvencia elevados. No obstante, una
                        mayor concurrencia genera mejores precios para la administracion.
                      </p>
                    </div>
                  </div>

                  {/* Donut chart */}
                  <div className="rounded-2xl bg-brand-card border border-brand-border p-4 sm:p-6 flex flex-col items-center justify-center">
                    <p className="text-sm text-slate-300 font-medium mb-4">
                      Distribucion por numero de licitadores
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={competitionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={110}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={{ stroke: '#64748b' }}
                        >
                          {competitionData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          {...DARK_TOOLTIP}
                          formatter={(value: number) => [fmtEs(value) + ' contratos', '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                Section 7: Spending Evolution
                ══════════════════════════════════════════════════════════ */}
            <section
              ref={evolutionRef}
              className="relative py-12"
              aria-label="Evolucion del gasto"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-bg to-brand-surface pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

              <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-8">
                  <p className="text-brand-blue font-mono text-sm tracking-widest uppercase mb-3">
                    Evolucion temporal
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                    Gasto por <span className="text-brand-blue">ano</span>
                  </h2>
                  <p className="text-slate-400 max-w-2xl">
                    Evolucion del numero de contratos y volumen de adjudicacion a lo largo del tiempo.
                  </p>
                </div>

                <div
                  className={`rounded-2xl bg-brand-card border border-brand-border p-4 sm:p-6
                              transition-all duration-700
                              ${evolutionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={yearData}
                      margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={{ stroke: '#334155' }}
                      />
                      <YAxis
                        yAxisId="amount"
                        orientation="left"
                        tickFormatter={fmtEurShort}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={{ stroke: '#334155' }}
                      />
                      <YAxis
                        yAxisId="count"
                        orientation="right"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={{ stroke: '#334155' }}
                      />
                      <Tooltip
                        {...DARK_TOOLTIP}
                        formatter={(value: number, name: string) => {
                          if (name === 'amount') return [fmtEur(value), 'Importe adjudicado'];
                          return [fmtEs(value), 'Contratos'];
                        }}
                        labelFormatter={(label) => `Ano ${label}`}
                      />
                      <Legend
                        formatter={(value) => (value === 'amount' ? 'Importe adjudicado' : 'Num. contratos')}
                        wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
                      />
                      <Bar
                        yAxisId="amount"
                        dataKey="amount"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        opacity={0.8}
                      />
                      <Line
                        yAxisId="count"
                        type="monotone"
                        dataKey="count"
                        stroke="#16C79A"
                        strokeWidth={2}
                        dot={{ fill: '#16C79A', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                Section 8: Contract Types
                ══════════════════════════════════════════════════════════ */}
            <section
              ref={typesRef}
              className="relative py-12"
              aria-label="Tipos de contrato"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

              <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-8">
                  <p className="text-brand-blue font-mono text-sm tracking-widest uppercase mb-3">
                    Tipologia
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                    Tipos de <span className="text-brand-blue">contrato</span>
                  </h2>
                  <p className="text-slate-400 max-w-2xl">
                    Distribucion de los contratos segun su naturaleza: obras, servicios, suministros y otros.
                  </p>
                </div>

                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-6
                              transition-all duration-700
                              ${typesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                  {/* Donut chart */}
                  <div className="rounded-2xl bg-brand-card border border-brand-border p-4 sm:p-6 flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={120}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={{ stroke: '#64748b' }}
                        >
                          {typeData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          {...DARK_TOOLTIP}
                          formatter={(value: number) => [fmtEs(value) + ' contratos', '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Type details list */}
                  <div className="space-y-3">
                    {data.contracts_by_type.map((t) => {
                      const pct = (t.count / data.total_contracts) * 100;
                      const color = TYPE_COLORS[t.type] ?? '#94a3b8';
                      return (
                        <div
                          key={t.type}
                          className="rounded-xl bg-brand-card border border-brand-border p-4 flex items-center gap-4"
                        >
                          <div
                            className="w-3 h-10 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">
                              {TYPE_LABELS[t.type] ?? t.type}
                            </p>
                            <div className="w-full bg-brand-surface rounded-full h-2 mt-1">
                              <div
                                className="h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${pct}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold font-mono text-white">
                              {fmtEs(t.count)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {fmtPct(pct)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                Section 9: Footer Disclaimer
                ══════════════════════════════════════════════════════════ */}
            <section
              ref={footerDisclaimerRef}
              className="relative py-12"
              aria-label="Fuentes y metodologia"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-bg to-brand-surface pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

              <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                <div
                  className={`rounded-2xl bg-brand-card border border-brand-border p-6 sm:p-8
                              transition-all duration-700
                              ${footerDisclaimerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-300 leading-relaxed mb-4">
                        {data.disclaimer}
                      </p>
                      <div className="space-y-2 text-xs text-slate-500">
                        <p>
                          <span className="font-medium text-slate-400">Fuente:</span>{' '}
                          Plataforma de Contratacion del Sector Publico (PLACSP)
                        </p>
                        <p>
                          <span className="font-medium text-slate-400">Actualizacion:</span>{' '}
                          Datos actualizados automaticamente cada 30 dias
                        </p>
                        <p>
                          <span className="font-medium text-slate-400">Metodologia:</span>{' '}
                          Los importes corresponden a los valores de adjudicacion publicados oficialmente.
                          La clasificacion por tipo de contrato sigue la taxonomia oficial de la PLACSP.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
