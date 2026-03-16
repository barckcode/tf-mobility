import { getContractsSummary } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

function formatMillions(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace('.', ',') + 'M';
  }
  if (value >= 1_000) {
    return Math.round(value / 1_000).toLocaleString('es-ES') + 'K';
  }
  return value.toLocaleString('es-ES');
}

const STATUS_COLORS: Record<string, string> = {
  adjudicado: 'bg-green',
  en_ejecucion: 'bg-yellow',
  finalizado: 'bg-brand-blue',
  licitacion: 'bg-slate-400',
  anulado: 'bg-red-accent',
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  obras: 'bg-brand-blue/20 text-brand-blue border-brand-blue/30',
  servicios: 'bg-brand-violet/20 text-brand-violet border-brand-violet/30',
  suministros: 'bg-green/20 text-green border-green/30',
};

export function ContractsSummary() {
  const { data, loading, error, refetch } = useFetch(getContractsSummary);

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mb-10 space-y-4">
      {/* KPI cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total contracts */}
        <article className="rounded-xl bg-brand-card border border-brand-border p-5
                          hover:border-brand-blue/40 transition-colors">
          <p className="text-xs text-slate-400 font-medium mb-2">Total contratos</p>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {data.total_contracts.toLocaleString('es-ES')}
          </p>
        </article>

        {/* Total licitacion amount */}
        <article className="rounded-xl bg-brand-card border border-brand-border p-5
                          hover:border-brand-blue/40 transition-colors">
          <p className="text-xs text-slate-400 font-medium mb-2">Importe licitación</p>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatMillions(data.total_licitacion_amount)}
            <span className="text-lg text-slate-400 ml-1">&euro;</span>
          </p>
        </article>

        {/* Total adjudicacion amount */}
        <article className="rounded-xl bg-brand-card border border-brand-border p-5
                          hover:border-brand-blue/40 transition-colors">
          <p className="text-xs text-slate-400 font-medium mb-2">Importe adjudicación</p>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-brand-blue tracking-tight">
            {formatMillions(data.total_adjudicacion_amount)}
            <span className="text-lg text-slate-400 ml-1">&euro;</span>
          </p>
        </article>

        {/* Status breakdown */}
        <article className="rounded-xl bg-brand-card border border-brand-border p-5
                          hover:border-brand-blue/40 transition-colors">
          <p className="text-xs text-slate-400 font-medium mb-3">Por estado</p>
          <div className="space-y-1.5">
            {data.contracts_by_status.map((s) => (
              <div key={s.status} className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    STATUS_COLORS[s.status] ?? 'bg-slate-500'
                  }`}
                />
                <span className="text-slate-300 capitalize flex-1">
                  {s.status.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* Type badges row */}
      {data.contracts_by_type.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 mr-1">Por tipo:</span>
          {data.contracts_by_type.map((t) => {
            const colorClass =
              TYPE_BADGE_COLORS[t.type.toLowerCase()] ??
              'bg-brand-card text-slate-300 border-brand-border';
            return (
              <span
                key={t.type}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1
                           text-xs font-medium ${colorClass}`}
              >
                <span className="capitalize">{t.type}</span>
                <span className="font-mono">{t.count}</span>
              </span>
            );
          })}

          {/* Top roads */}
          {data.top_roads.length > 0 && (
            <>
              <span className="text-xs text-slate-500 ml-4 mr-1">Carreteras:</span>
              {data.top_roads.slice(0, 5).map((r) => (
                <span
                  key={r.road}
                  className="inline-flex items-center gap-1.5 rounded-full border
                             border-brand-border bg-brand-card px-3 py-1 text-xs
                             font-mono text-slate-300"
                >
                  {r.road}
                  <span className="text-slate-500">{r.count}</span>
                </span>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
