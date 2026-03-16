// API response types

export interface StatsResponse {
  registered_cars: number;
  total_vehicles: number;
  cars_per_km2: number;
  population: number;
  motorization_index: number;
  island_area_km2: number;
  data_year: number;
  sources: Record<string, string>;
}

export interface Contract {
  id: number;
  expediente: string;
  objeto: string;
  tipo: string;
  importe_licitacion: number;
  importe_adjudicacion: number;
  adjudicatario: string;
  fecha: string;
  estado: string;
  carreteras: string[];
  source_url?: string;
}

export interface ContractsResponse {
  items: Contract[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CompanyRanking {
  company: string;
  total_amount: number;
  contract_count: number;
}

export interface RankingsResponse {
  top_companies: CompanyRanking[];
}

export interface Project {
  id: number;
  name: string;
  description: string;
  announced_date: string;
  promised_date: string;
  status: 'completado' | 'en_plazo' | 'retrasado' | 'paralizado' | 'sin_iniciar';
  responsible_entity: string;
  sources: { label: string; url: string }[];
  related_contracts: string[];
  last_update: string;
}

export interface ProjectsResponse {
  projects: Project[];
  summary: {
    on_track: number;
    delayed: number;
    stalled: number;
  };
}

export interface ContractFilters {
  road?: string;
  company?: string;
  min_amount?: number;
  max_amount?: number;
  year?: number;
  type?: string;
  status?: string;
}

// S2 — Tourism
export interface TourismMonthly {
  year: number;
  month: number;
  tourists: number;
  island: string;
  source: string;
}

export interface TourismResponse {
  data: TourismMonthly[];
  total_records: number;
}

// S5 — Alternatives
export interface Alternative {
  id: number;
  name: string;
  type: string;
  description: string;
  status: string; // "operativo", "en_estudio", "fragmentado", "reciente"
  operator?: string;
  coverage?: string;
  annual_users?: number;
  key_fact?: string;
  color?: string;
  icon?: string;
  source_url?: string;
}

export interface AlternativesResponse {
  alternatives: Alternative[];
  summary: Record<string, number>;
}

// S6 — Comparison
export interface IslandComparison {
  id: number;
  island: string;
  community: string;
  population: number;
  area_km2: number;
  annual_tourists: number;
  tourist_resident_ratio: number;
  registered_vehicles: number;
  cars_per_km2: number;
  road_investment_m_eur: number;
  road_km: number;
  has_train: string;
  has_tram: string;
  traffic_regulation: string;
  source: string;
}

export interface ComparisonResponse {
  islands: IslandComparison[];
  canary_islands: IslandComparison[];
  reference_islands: IslandComparison[];
  highlights: Record<string, string>;
}

// S1 — Traffic Intensity
export interface TrafficStation {
  id: number;
  year: number;
  road: string;
  section: string;
  station_id: number;
  station_name: string;
  imd_total: number | null;
  imd_ascending: number | null;
  imd_descending: number | null;
  imd_heavy: number | null;
  avg_speed: number | null;
}

export interface RoadSummary {
  road: string;
  max_imd: number;
  stations: number;
}

export interface TrafficResponse {
  stations: TrafficStation[];
  total: number;
  year: number;
  roads_summary: RoadSummary[];
}

export interface TrafficYearsResponse {
  available_years: number[];
}

// S3 — Contracts Summary
export interface ContractsSummaryResponse {
  total_contracts: number;
  total_licitacion_amount: number;
  total_adjudicacion_amount: number;
  contracts_by_year: { year: number; count: number; amount: number }[];
  contracts_by_type: { type: string; count: number }[];
  contracts_by_status: { status: string; count: number }[];
  top_roads: { road: string; count: number }[];
}

// Metadata — Data freshness
export interface PipelineFreshness {
  pipeline: string;
  last_success: string | null;
  last_run: string | null;
  last_status: string;
  records_processed: number;
  days_since_update: number | null;
  freshness: string; // "fresh" | "stale" | "outdated" | "unknown"
}

export interface FreshnessResponse {
  pipelines: PipelineFreshness[];
  overall_freshness: string;
  last_etl_run: string | null;
}
