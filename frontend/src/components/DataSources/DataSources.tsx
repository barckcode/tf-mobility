import { getFreshness } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PipelineFreshness } from '@/types';

/** Static metadata for each data source */
interface DataSourceInfo {
  name: string;
  description: string;
  url: string;
  timespan: string;
  pipelines: string[];
  color: string;
}

const DATA_SOURCES: DataSourceInfo[] = [
  {
    name: 'ISTAC',
    description: 'Llegadas de turistas por isla, mensuales',
    url: 'https://datos.canarias.es/api/estadisticas/',
    timespan: '2010 - presente',
    pipelines: ['turismo'],
    color: 'bg-brand-blue',
  },
  {
    name: 'INE',
    description: 'Poblacion (Padron Municipal)',
    url: 'https://www.ine.es/',
    timespan: 'Actualizacion anual',
    pipelines: ['estadisticas'],
    color: 'bg-green',
  },
  {
    name: 'DGT',
    description: 'Parque vehicular (turismos, totales)',
    url: 'https://www.dgt.es/menusecundario/dgt-en-cifras/',
    timespan: 'Anuario Estadistico',
    pipelines: ['estadisticas'],
    color: 'bg-yellow',
  },
  {
    name: 'PLACSP',
    description: 'Contratos publicos (Cabildo de Tenerife)',
    url: 'https://contrataciondelsectorpublico.gob.es/',
    timespan: '2016 - presente',
    pipelines: ['contratos'],
    color: 'bg-red-accent',
  },
  {
    name: 'datos.tenerife.es',
    description: 'Intensidad de trafico (IMD) por carretera',
    url: 'https://datos.tenerife.es/',
    timespan: '2020 - presente',
    pipelines: ['trafico_imd'],
    color: 'bg-brand-violet',
  },
  {
    name: 'Plan de Movilidad Sostenible',
    description: 'Proyectos de infraestructura, alternativas de transporte',
    url: 'https://www.tenerife.es/portalcabtfe/es/site_content/541-movilidad',
    timespan: '2024 - 2035',
    pipelines: ['proyectos', 'alternativas'],
    color: 'bg-slate-400',
  },
];

/** Format a date string to Spanish locale */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Sin datos';
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Fecha no valida';
  }
}

/** Get the freshness data for a source by matching its pipeline names */
function getSourceFreshness(
  source: DataSourceInfo,
  pipelines: PipelineFreshness[]
): { records: number; lastUpdated: string | null } {
  let totalRecords = 0;
  let latestUpdate: string | null = null;

  for (const pipelineName of source.pipelines) {
    const match = pipelines.find((p) => p.pipeline === pipelineName);
    if (match) {
      totalRecords += match.records_processed;
      if (match.last_success) {
        if (!latestUpdate || new Date(match.last_success) > new Date(latestUpdate)) {
          latestUpdate = match.last_success;
        }
      }
    }
  }

  return { records: totalRecords, lastUpdated: latestUpdate };
}

/** External link arrow icon */
function ExternalLinkIcon() {
  return (
    <svg
      className="inline-block h-3.5 w-3.5 ml-1 -mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function SourceCard({
  source,
  pipelines,
}: {
  source: DataSourceInfo;
  pipelines: PipelineFreshness[] | null;
}) {
  const freshness = pipelines ? getSourceFreshness(source, pipelines) : null;

  return (
    <div
      className="group rounded-xl border border-brand-border/60 bg-brand-card/50 p-5
                 transition-all duration-200 hover:border-brand-border hover:bg-brand-card/80"
    >
      {/* Header: colored dot + name */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`inline-block h-3 w-3 rounded-full ${source.color} flex-shrink-0`}
          aria-hidden="true"
        />
        <h3 className="font-bold text-slate-100 text-sm sm:text-base leading-tight">
          {source.name}
        </h3>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm mb-4 leading-relaxed">{source.description}</p>

      {/* Metadata grid */}
      <div className="space-y-2 mb-4">
        {/* Records */}
        {freshness && freshness.records > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Registros</span>
            <span className="font-mono text-slate-300">
              {freshness.records.toLocaleString('es-ES')}
            </span>
          </div>
        )}

        {/* Timespan */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Periodo</span>
          <span className="font-mono text-slate-300">{source.timespan}</span>
        </div>

        {/* Last updated */}
        {freshness && freshness.lastUpdated && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Actualizado</span>
            <span className="font-mono text-slate-300">
              {formatDate(freshness.lastUpdated)}
            </span>
          </div>
        )}
      </div>

      {/* External link */}
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-xs text-brand-blue hover:text-brand-blue-hover
                   transition-colors"
      >
        Ver fuente oficial
        <ExternalLinkIcon />
      </a>
    </div>
  );
}

function SourceCardSkeleton() {
  return (
    <div className="rounded-xl border border-brand-border/60 bg-brand-card/50 p-5">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-full mb-4" />
      <div className="space-y-2 mb-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function DataSources() {
  const { data, loading } = useFetch(getFreshness);

  return (
    <section
      id="sources"
      className="relative pt-24 pb-16 sm:pt-28 sm:pb-20"
      aria-label="Transparencia de datos - Fuentes oficiales"
    >
      {/* Background differentiation */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-surface/40 to-brand-bg pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 w-full">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-brand-blue font-mono text-sm tracking-widest uppercase mb-3">
            Transparencia de datos
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Nuestras <span className="gradient-text">Fuentes</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Todos los datos provienen de fuentes publicas oficiales.
            Cada dato es verificable y trazable.
          </p>
        </div>

        {/* Source cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SourceCardSkeleton key={i} />)
            : DATA_SOURCES.map((source) => (
                <SourceCard
                  key={source.name}
                  source={source}
                  pipelines={data?.pipelines ?? null}
                />
              ))}
        </div>

        {/* Overall freshness note */}
        {data && (
          <p className="text-center mt-8 text-xs text-slate-500 font-mono">
            Ultima actualizacion ETL:{' '}
            {data.last_etl_run ? formatDate(data.last_etl_run) : 'Sin datos'}
          </p>
        )}
      </div>
    </section>
  );
}
