import { useFetch } from '@/hooks/useFetch';
import { useIntersection } from '@/hooks/useIntersection';
import { getFreshness } from '@/lib/api';
import { CardSkeleton } from '@/components/ui/Skeleton';

interface SourceCard {
  pipeline: string;
  label: string;
  description: string;
  icon: string;
  sourceOrg: string;
  color: string;
}

const SOURCE_CARDS: SourceCard[] = [
  {
    pipeline: 'trafico_imd',
    label: 'Tráfico (IMD)',
    description:
      'Intensidad Media Diaria de 330+ estaciones de aforo en todas las carreteras insulares. Datos desde 2020.',
    icon: '🚗',
    sourceOrg: 'Cabildo de Tenerife (datos.tenerife.es)',
    color: '#E94560',
  },
  {
    pipeline: 'turismo',
    label: 'Turismo',
    description:
      'Llegadas mensuales de turistas por isla desde 2010. Desglose por origen y evolución temporal.',
    icon: '✈️',
    sourceOrg: 'ISTAC (Instituto Canario de Estadística)',
    color: '#3b82f6',
  },
  {
    pipeline: 'contratos',
    label: 'Contratos públicos',
    description:
      'Licitaciones y adjudicaciones de movilidad del Cabildo de Tenerife. NIF, importes, nº de ofertas.',
    icon: '📋',
    sourceOrg: 'PLACSP (Plataforma de Contratación del Sector Público)',
    color: '#8b5cf6',
  },
  {
    pipeline: 'transporte_publico',
    label: 'Guaguas TITSA',
    description:
      'Red completa de autobuses: 3.854 paradas, 177 rutas, frecuencias por parada, corredores congestionados.',
    icon: '🚌',
    sourceOrg: 'TITSA GTFS (datos.tenerife.es)',
    color: '#16C79A',
  },
  {
    pipeline: 'tranvia',
    label: 'Tranvía Metrotenerife',
    description:
      'Sistema de tranvía: 25 paradas, 2 líneas, frecuencias y capacidad. 25M pasajeros/año.',
    icon: '🚊',
    sourceOrg: 'Metropolitano de Tenerife (GTFS)',
    color: '#a855f7',
  },
  {
    pipeline: 'estadisticas',
    label: 'Parque vehicular',
    description:
      'Vehículos registrados, índice de motorización, población y superficie de la isla.',
    icon: '📊',
    sourceOrg: 'DGT / ISTAC / INE',
    color: '#f97316',
  },
  {
    pipeline: 'alternativas',
    label: 'Alternativas de transporte',
    description:
      'Taxis (2.266 licencias), VTC (89 Uber), bicicletas, transporte a demanda. Índice motorización: 839/1.000 hab.',
    icon: '🚕',
    sourceOrg: 'INE / Ministerio Transportes / OMM',
    color: '#eab308',
  },
  {
    pipeline: 'comparativa',
    label: 'Comparativa insular',
    description:
      'Tenerife vs otras islas (Gran Canaria, Mallorca, Ibiza, Madeira, Azores). Regulación vehicular.',
    icon: '🏝️',
    sourceOrg: 'Múltiples fuentes oficiales',
    color: '#22c55e',
  },
  {
    pipeline: 'proyectos',
    label: 'Proyectos de infraestructura',
    description:
      'Estado del Tren del Sur, Tren del Norte, Anillo Insular, tercer carril TF-5 y más.',
    icon: '🏗️',
    sourceOrg: 'Cabildo de Tenerife / Gobierno de Canarias',
    color: '#06b6d4',
  },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Pendiente';
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/D';
  }
}

function fmtRecords(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.', ',')}K`;
  return n.toLocaleString('es-ES');
}

export function DataSources() {
  const { data, loading } = useFetch(getFreshness);
  const [ref, isVisible] = useIntersection(0.1);

  const pipelineMap = new Map(
    data?.pipelines?.map((p) => [p.pipeline, p]) ?? [],
  );

  return (
    <section
      ref={ref}
      className="relative py-16"
      aria-label="Fuentes de datos públicos"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-green font-mono text-sm tracking-widest uppercase mb-3">
            Datos abiertos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Fuentes de datos <span className="text-green">públicos</span>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Todo el observatorio se construye a partir de fuentes de datos
            públicas y verificables. Cada cifra que ves tiene un origen oficial y
            trazable.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4
                        transition-all duration-700
                        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            {SOURCE_CARDS.map((card, i) => {
              const pipeline = pipelineMap.get(card.pipeline);
              const records = pipeline?.records_processed ?? 0;
              const lastUpdate = pipeline?.last_success ?? null;
              const isFresh = pipeline?.freshness === 'fresh';

              return (
                <div
                  key={card.pipeline}
                  className="rounded-xl bg-brand-card border border-brand-border p-5
                             hover:border-brand-border/80 transition-colors"
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{card.icon}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {card.label}
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {card.sourceOrg}
                        </p>
                      </div>
                    </div>
                    {records > 0 && (
                      <span
                        className="font-mono text-lg font-bold"
                        style={{ color: card.color }}
                      >
                        {fmtRecords(records)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {card.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          isFresh ? 'bg-green' : 'bg-yellow'
                        }`}
                      />
                      <span className="text-[10px] text-slate-500">
                        {lastUpdate ? formatDate(lastUpdate) : 'Pendiente'}
                      </span>
                    </div>
                    {records > 0 && (
                      <span className="text-[10px] text-slate-500">
                        {records.toLocaleString('es-ES')} registros
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center mt-8 text-xs text-slate-500">
          Todos los datos son de acceso público y se actualizan automáticamente
          cada 30 días
        </p>
      </div>
    </section>
  );
}
