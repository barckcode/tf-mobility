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
  month: string;
  tourists: number;
}

export interface TourismResponse {
  monthly: TourismMonthly[];
  summary: {
    total_tourists_year: number;
    rental_cars: number;
    avg_daily_spend: number;
    avg_stay_days: number;
  };
}

// S5 — Alternatives
export interface Alternative {
  id: number;
  name: string;
  type: string;
  description: string;
  status: string;
  users_annual?: number;
  coverage_pct?: number;
}

export interface AlternativesResponse {
  alternatives: Alternative[];
}

// S6 — Comparison
export interface IslandComparison {
  island: string;
  vehicle_density: number;
  tourists_per_inhabitant: number;
  road_investment: number;
  has_regulation: boolean;
  population: number;
}

export interface ComparisonResponse {
  islands: IslandComparison[];
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
