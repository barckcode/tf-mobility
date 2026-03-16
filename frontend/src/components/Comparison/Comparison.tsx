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
            Cómo se compara Tenerife con las demás islas en densidad vehicular,
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
            {/* Tourist pressure ranking — Top 10 */}
            {(() => {
              const ranked = data.islands
                .filter((i) => (i.tourist_resident_ratio || 0) > 0)
                .sort((a, b) => (b.tourist_resident_ratio || 0) - (a.tourist_resident_ratio || 0))
                .slice(0, 10);

              const maxRatio = ranked.length > 0 ? ranked[0].tourist_resident_ratio || 1 : 1;

              return (
                <div className="rounded-xl bg-brand-card border border-brand-border p-6">
                  <h3 className="text-lg font-semibold mb-1">Ranking de presión turística</h3>
                  <p className="text-xs text-slate-400 mb-5">
                    Turistas por habitante · Top 10 islas · Fuente: ISTAC, INE
                  </p>
                  <div className="space-y-2">
                    {ranked.map((island, idx) => {
                      const isTenerife = island.island === 'Tenerife';
                      const ratio = island.tourist_resident_ratio || 0;
                      const barWidth = Math.max((ratio / maxRatio) * 100, 2);

                      return (
                        <div
                          key={island.island}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                            isTenerife
                              ? 'bg-red-accent/10 border border-red-accent/40'
                              : 'bg-brand-surface/50'
                          }`}
                        >
                          <span className={`font-mono text-xs w-6 text-right ${
                            isTenerife ? 'text-red-accent font-bold' : 'text-slate-500'
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className={`text-sm w-28 sm:w-36 truncate ${
                            isTenerife ? 'font-bold text-red-accent' : 'font-medium'
                          }`}>
                            {island.island}
                          </span>
                          <div className="flex-1 h-5 bg-brand-bg rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isTenerife ? 'bg-red-accent' : 'bg-yellow/70'
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className={`font-mono text-sm w-14 text-right ${
                            isTenerife ? 'text-red-accent font-bold' : 'text-slate-300'
                          }`}>
                            {ratio.toFixed(1)}x
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <ComparisonChart islands={data.islands} />
            <ComparisonTable islands={data.islands} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
