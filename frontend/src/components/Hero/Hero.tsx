import { getStats } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { useIntersection } from '@/hooks/useIntersection';
import { KpiCard } from './KpiCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export function Hero() {
  const { data, loading, error, refetch } = useFetch(getStats);
  const [ref, isVisible] = useIntersection(0.15);

  const kpis = data
    ? [
        {
          icon: '\u{1F697}',
          label: 'Turismos registrados',
          value: data.registered_cars,
          suffix: '',
          source: 'DGT',
        },
        {
          icon: '\u{1F698}',
          label: 'Vehículos totales',
          value: data.total_vehicles,
          suffix: '',
          source: 'DGT',
        },
        {
          icon: '\u{1F4CA}',
          label: 'Coches por km²',
          value: data.cars_per_km2,
          decimals: 1,
          source: 'Cálculo propio',
        },
        {
          icon: '\u{1F465}',
          label: 'Población',
          value: data.population,
          suffix: '',
          source: 'INE',
        },
        {
          icon: '\u{1F4C8}',
          label: 'Índice motorización (por 1.000 hab.)',
          value: data.motorization_index,
          decimals: 0,
          source: 'Cálculo propio',
        },
      ]
    : [];

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-screen flex items-center pt-20 pb-16"
      aria-label="El Impacto - Estadísticas clave de movilidad"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-surface pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full
                      bg-brand-blue/[0.04] blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 w-full">
        {/* Section title */}
        <div className="text-center mb-12">
          <p className="text-brand-blue font-mono text-sm tracking-widest uppercase mb-3">
            Observatorio de Movilidad
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            El <span className="gradient-text-red">Impacto</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Tenerife tiene uno de los índices de motorización más altos del mundo.
            Estos son los números que lo demuestran.
          </p>
        </div>

        {/* KPI Grid */}
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {kpis.map((kpi, i) => (
              <div key={kpi.label} style={{ transitionDelay: `${i * 150}ms` }}>
                <KpiCard
                  icon={kpi.icon}
                  label={kpi.label}
                  value={kpi.value}
                  suffix={kpi.suffix}
                  decimals={kpi.decimals}
                  source={kpi.source}
                  visible={isVisible}
                />
              </div>
            ))}
          </div>
        )}

        {/* Data year note */}
        {data && (
          <p className="text-center mt-8 text-xs text-slate-500">
            Datos correspondientes al año {data.data_year} — Isla de Tenerife ({data.island_area_km2} km²)
          </p>
        )}
      </div>
    </section>
  );
}
