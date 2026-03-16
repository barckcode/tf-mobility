import { getTourism } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { useIntersection } from '@/hooks/useIntersection';
import { TourismChart } from './TourismChart';
import { TourismKpis } from './TourismKpis';
import { RegulationTable } from './RegulationTable';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export function Tourism() {
  const { data, loading, error, refetch } = useFetch(getTourism);
  const [ref, isVisible] = useIntersection(0.1);

  return (
    <section
      id="tourism"
      ref={ref}
      className="relative py-20"
      aria-label="El Factor Turismo - Impacto del turismo en la movilidad"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-12">
          <p className="text-yellow font-mono text-sm tracking-widest uppercase mb-3">
            Presión sobre las carreteras
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            El Factor <span className="text-yellow">Turismo</span>
          </h2>
          <p className="text-slate-300 max-w-2xl">
            Más de 7 millones de turistas al año se suman a la red viaria de una isla
            que no tiene regulación de vehículos turísticos.
          </p>
        </div>

        {/* KPIs */}
        <div className="mb-8">
          <TourismKpis visible={isVisible} />
        </div>

        {/* Chart + Regulation table */}
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <TourismChart data={data.data} />
            <RegulationTable />
          </div>
        ) : (
          /* API not ready yet — show static content */
          <RegulationTable />
        )}
      </div>
    </section>
  );
}
