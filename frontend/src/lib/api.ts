import type {
  StatsResponse,
  ContractsResponse,
  RankingsResponse,
  ProjectsResponse,
  ContractFilters,
  TourismResponse,
  AlternativesResponse,
  ComparisonResponse,
  FreshnessResponse,
  TrafficResponse,
  TrafficYearsResponse,
  ContractsSummaryResponse,
} from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getStats(): Promise<StatsResponse> {
  return fetchJSON<StatsResponse>(`${API_BASE}/stats`);
}

export async function getContracts(
  page: number = 1,
  size: number = 20,
  filters: ContractFilters = {}
): Promise<ContractsResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));

  if (filters.road) params.set('road', filters.road);
  if (filters.company) params.set('company', filters.company);
  if (filters.min_amount) params.set('min_amount', String(filters.min_amount));
  if (filters.max_amount) params.set('max_amount', String(filters.max_amount));
  if (filters.year) params.set('year', String(filters.year));
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);

  return fetchJSON<ContractsResponse>(`${API_BASE}/contracts?${params}`);
}

export async function getRankings(): Promise<RankingsResponse> {
  return fetchJSON<RankingsResponse>(`${API_BASE}/contracts/rankings`);
}

export async function getProjects(): Promise<ProjectsResponse> {
  return fetchJSON<ProjectsResponse>(`${API_BASE}/projects`);
}

export async function getTourism(): Promise<TourismResponse> {
  return fetchJSON<TourismResponse>(`${API_BASE}/tourism/monthly`);
}

export async function getAlternatives(): Promise<AlternativesResponse> {
  return fetchJSON<AlternativesResponse>(`${API_BASE}/alternatives`);
}

export async function getComparison(): Promise<ComparisonResponse> {
  return fetchJSON<ComparisonResponse>(`${API_BASE}/comparison`);
}

export async function getFreshness(): Promise<FreshnessResponse> {
  return fetchJSON<FreshnessResponse>(`${API_BASE}/metadata/freshness`);
}

export async function getTraffic(year?: number): Promise<TrafficResponse> {
  const params = year ? `?year=${year}` : '';
  return fetchJSON<TrafficResponse>(`${API_BASE}/traffic${params}`);
}

export async function getTrafficYears(): Promise<TrafficYearsResponse> {
  return fetchJSON<TrafficYearsResponse>(`${API_BASE}/traffic/years`);
}

export async function getContractsSummary(): Promise<ContractsSummaryResponse> {
  return fetchJSON<ContractsSummaryResponse>(`${API_BASE}/contracts/summary`);
}
