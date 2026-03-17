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

// S7 — Transit (Public Transport)
export interface TransitSummary {
  total_stops: number;
  total_routes: number;
  avg_buses_per_day: number;
  busiest_stop_name: string;
  busiest_stop_buses: number;
  routes_on_congested_roads: number;
}

export interface TransitStop {
  stop_id: string;
  name: string;
  lat: number;
  lon: number;
  buses_dia: number;
  rutas_count: number;
}

export interface TransitRoute {
  route_id: string;
  short_name: string;
  long_name: string;
  color: string;
  corridors: string[];
}

export interface CorridorRoute {
  route_id: string;
  short_name: string;
  long_name: string;
  overlap_description: string;
}

export interface Corridor {
  road_code: string;
  routes: CorridorRoute[];
}

export interface TransitCorridorsResponse {
  corridors: Corridor[];
}

export interface TransitStopsResponse {
  stops: TransitStop[];
  total: number;
}

export interface TransitRoutesResponse {
  routes: TransitRoute[];
  total: number;
}

// S7b — Tram (Tranvía)
export interface TramSummary {
  total_stops: number;
  total_routes: number;
  avg_trams_per_day: number;
  busiest_stop_name: string;
  busiest_stop_trams: number;
  network_km: number;
  annual_passengers: number;
}

export interface TramStop {
  id: number;
  stop_id: string;
  name: string;
  lat: number;
  lon: number;
  trams_dia: number | null;
  rutas_count: number | null;
}

export interface TramStopsResponse {
  stops: TramStop[];
  total: number;
}

// S7c — Transit Study (comprehensive)
export interface TransitStudy {
  bus_stops: number;
  bus_routes: number;
  bus_avg_frequency: number;
  bus_annual_passengers: number;
  tram_stops: number;
  tram_routes: number;
  tram_avg_frequency: number;
  tram_annual_passengers: number;
  tram_network_km: number;
  taxi_licenses_canarias: number;
  taxi_licenses_sc_tenerife: number;
  taxi_adapted_pmr: number;
  vtc_licenses_active: number;
  vtc_operator: string;
  vtc_coverage: string;
  vtc_blocked_applications: number;
  motorization_index: number;
  population: number;
  annual_tourists: number;
  total_public_transport_passengers: number;
  alternatives_verdict: string;
}

// S8 — Contracts Transparency
export interface ContractTransparency {
  total_contracts: number;
  total_awarded_amount: number;
  avg_competitors_per_contract: number;
  contracts_single_bidder: number;
  contracts_single_bidder_pct: number;
  top_companies: TransparencyCompanyRanking[];
  contracts_by_year: { year: number; count: number; amount: number }[];
  contracts_by_type: { type: string; count: number }[];
  concentration_top5_pct: number;
  concentration_top10_pct: number;
  savings_avg_pct: number;
  disclaimer: string;
}

export interface TransparencyCompanyRanking {
  company: string;
  cif: string | null;
  total_amount: number;
  contract_count: number;
  avg_competitors: number | null;
}

// S8b — Directors & Public Connections
export interface DirectorInfo {
  name: string;
  role: string;
  source: string;
}

export interface PublicConnection {
  description: string;
  source_name: string;
  source_url: string;
}

export interface CompanyDirectors {
  company: string;
  cif: string | null;
  total_contracts: number;
  total_amount: number;
  directors: DirectorInfo[];
  public_connections: PublicConnection[];
  cnmc_sanction: string | null;
  judicial_cases: string | null;
  confidence_level: string;
}

export interface DirectorsTransparency {
  companies: CompanyDirectors[];
  methodology: string;
  disclaimer: string;
  last_updated: string;
  sources_count: number;
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
