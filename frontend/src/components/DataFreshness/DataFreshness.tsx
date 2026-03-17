import { useState } from 'react';
import { getFreshness } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PipelineFreshness } from '@/types';

const PIPELINE_LABELS: Record<string, string> = {
  turismo: 'Turismo (ISTAC)',
  contratos: 'Contratos públicos (PLACSP)',
  estadisticas: 'Estadísticas (DGT / ISTAC)',
  trafico_imd: 'Tráfico IMD (datos.tenerife.es)',
  proyectos: 'Proyectos de infraestructura',
  alternativas: 'Alternativas de transporte',
  comparativa: 'Comparativa insular',
  transporte_publico: 'Guaguas TITSA (GTFS)',
  tranvia: 'Tranvía Metrotenerife (GTFS)',
};

function freshnessColor(freshness: string): string {
  switch (freshness) {
    case 'fresh': return 'bg-green';
    case 'stale': return 'bg-yellow';
    case 'outdated': return 'bg-red-accent';
    default: return 'bg-slate-500';
  }
}

function freshnessLabel(freshness: string): string {
  switch (freshness) {
    case 'fresh': return 'Actualizado';
    case 'stale': return 'Desactualizado';
    case 'outdated': return 'Obsoleto';
    default: return 'Desconocido';
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Fecha no válida';
  }
}

function summaryText(overallFreshness: string, lastEtlRun: string | null): string {
  const label = freshnessLabel(overallFreshness);
  if (lastEtlRun) {
    const daysAgo = Math.floor(
      (Date.now() - new Date(lastEtlRun).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysAgo === 0) return `${label} — datos actualizados hoy`;
    if (daysAgo === 1) return `${label} — datos actualizados ayer`;
    return `${label} — datos actualizados hace ${daysAgo} días`;
  }
  return `Estado de datos: ${label}`;
}

function PipelineRow({ pipeline }: { pipeline: PipelineFreshness }) {
  const displayName = PIPELINE_LABELS[pipeline.pipeline] || pipeline.pipeline;
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 gap-y-1 py-1.5 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${freshnessColor(pipeline.freshness)}`}
          aria-label={freshnessLabel(pipeline.freshness)}
        />
        <span className="text-slate-200 truncate">{displayName}</span>
      </div>
      <span className="text-slate-400 text-xs whitespace-nowrap">
        {formatDate(pipeline.last_success)}
      </span>
      <span className="text-slate-500 text-xs whitespace-nowrap">
        {pipeline.records_processed > 0
          ? `${pipeline.records_processed.toLocaleString('es-ES')} reg.`
          : '—'}
      </span>
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          pipeline.freshness === 'fresh'
            ? 'bg-green/10 text-green'
            : pipeline.freshness === 'stale'
              ? 'bg-yellow/10 text-yellow'
              : pipeline.freshness === 'outdated'
                ? 'bg-red-accent/10 text-red-accent'
                : 'bg-slate-600/20 text-slate-400'
        }`}
      >
        {freshnessLabel(pipeline.freshness)}
      </span>
    </div>
  );
}

export function DataFreshness() {
  const { data, loading, error } = useFetch(getFreshness);
  const [expanded, setExpanded] = useState(false);

  if (error) return null;

  if (loading) {
    return (
      <div className="border-t border-brand-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <Skeleton className="h-5 w-64" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="border-t border-brand-border bg-brand-surface/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between py-3 text-left
                     transition-colors hover:bg-brand-card/30 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded"
          aria-expanded={expanded}
          aria-controls="freshness-details"
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${freshnessColor(data.overall_freshness)}`}
              aria-hidden="true"
            />
            <span className="text-sm text-slate-300">
              {summaryText(data.overall_freshness, data.last_etl_run)}
            </span>
          </div>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div
            id="freshness-details"
            className="pb-4 pt-1 border-t border-brand-border/50"
          >
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-mono">
              Origen y estado de cada fuente de datos
            </p>
            <div className="divide-y divide-brand-border/30">
              {data.pipelines.map((pipeline) => (
                <PipelineRow key={pipeline.pipeline} pipeline={pipeline} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
