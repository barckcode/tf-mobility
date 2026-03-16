import { getComparison } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { ComparisonChart } from './ComparisonChart';
import { ComparisonTable } from './ComparisonTable';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export function Comparison() {
  const { data, loading, error, refetch } = useFetch(getComparison);

  return (
    <section
      id="comparison"
      className="relative py-20"
      aria-label="Contexto Comparativo - Tenerife frente a otras islas"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-12">
          <p className="text-gray font-mono text-sm tracking-widest uppercase mb-3">
            Perspectiva insular
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Contexto <span className="text-gray">Comparativo</span>
          </h2>
          <p className="text-slate-300 max-w-2xl">
            Cómo se compara Tenerife con las demás islas canarias en densidad vehicular,
            presión turística e inversión en infraestructuras.
          </p>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Tourist pressure highlight */}
            <div className="rounded-xl bg-brand-card border border-brand-border p-6">
              <h3 className="text-lg font-semibold mb-4">Presión turística</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(() => {
                  const withRatio = data.islands
                    .filter((i) => (i.tourist_resident_ratio || 0) > 0)
                    .sort((a, b) => (b.tourist_resident_ratio || 0) - (a.tourist_resident_ratio || 0));
                  const top3 = withRatio.slice(0, 3);
                  const hasTenerife = top3.some((i) => i.island === 'Tenerife');
                  const result = hasTenerife
                    ? top3
                    : [
                        ...withRatio.filter((i) => i.island !== 'Tenerife').slice(0, 2),
                        ...withRatio.filter((i) => i.island === 'Tenerife').slice(0, 1),
                      ].sort((a, b) => (b.tourist_resident_ratio || 0) - (a.tourist_resident_ratio || 0));
                  return result;
                })().map((island, idx) => (
                    <div
                      key={island.island}
                      className="rounded-lg bg-brand-surface border border-brand-border p-4 text-center"
                    >
                      <p className="text-xs text-slate-500 mb-1">
                        {idx === 0 ? 'Mayor presión' : `#${idx + 1}`}
                      </p>
                      <p className="font-mono text-2xl font-bold text-yellow">
                        {(island.tourist_resident_ratio || 0).toFixed(1)}x
                      </p>
                      <p className="text-sm font-medium mt-1">{island.island}</p>
                      <p className="text-xs text-slate-400 mt-0.5">turistas por habitante</p>
                    </div>
                  ))}
              </div>
            </div>

            <ComparisonChart islands={data.islands} />
            <ComparisonTable islands={data.islands} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
