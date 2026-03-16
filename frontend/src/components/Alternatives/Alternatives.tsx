import { getAlternatives } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { AlternativeCard } from './AlternativeCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export function Alternatives() {
  const { data, loading, error, refetch } = useFetch(getAlternatives);

  return (
    <section
      id="alternatives"
      className="relative py-20"
      aria-label="Alternativas al Coche - Transporte público y movilidad sostenible"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-brand-bg to-brand-surface pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-12">
          <p className="text-green font-mono text-sm tracking-widest uppercase mb-3">
            Movilidad sostenible
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Alternativas al <span className="text-green">Coche</span>
          </h2>
          <p className="text-slate-300 max-w-2xl">
            Estado actual de las opciones de transporte público y movilidad alternativa
            disponibles en Tenerife.
          </p>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : data ? (
          <>
            {/* Summary counters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 max-w-md">
              <div className="rounded-xl bg-green/10 border border-green/20 p-4 text-center">
                <p className="font-mono text-2xl font-bold text-green">
                  {data.alternatives.filter((a) => a.status === 'active').length}
                </p>
                <p className="text-xs text-green/70 mt-1">Operativos</p>
              </div>
              <div className="rounded-xl bg-brand-blue/10 border border-brand-blue/20 p-4 text-center">
                <p className="font-mono text-2xl font-bold text-brand-blue">
                  {data.alternatives.filter((a) => a.status === 'planned').length}
                </p>
                <p className="text-xs text-brand-blue/70 mt-1">Planificados</p>
              </div>
              <div className="rounded-xl bg-yellow/10 border border-yellow/20 p-4 text-center">
                <p className="font-mono text-2xl font-bold text-yellow">
                  {data.alternatives.filter((a) => a.status === 'limited').length}
                </p>
                <p className="text-xs text-yellow/70 mt-1">Limitados</p>
              </div>
            </div>

            {/* Alternative cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.alternatives.map((alt) => (
                <AlternativeCard key={alt.id} alternative={alt} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
