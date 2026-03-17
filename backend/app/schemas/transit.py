from pydantic import BaseModel


class BusStopResponse(BaseModel):
    id: int
    stop_id: str
    name: str
    lat: float
    lon: float
    buses_dia: int | None = None
    rutas_count: int | None = None

    model_config = {"from_attributes": True}


class BusRouteResponse(BaseModel):
    id: int
    route_id: str
    short_name: str
    long_name: str
    color: str
    corridors: list[str] = []

    model_config = {"from_attributes": True}


class TransitStopsResponse(BaseModel):
    stops: list[BusStopResponse]
    total: int


class TransitRoutesResponse(BaseModel):
    routes: list[BusRouteResponse]
    total: int


class TransitSummaryResponse(BaseModel):
    total_stops: int
    total_routes: int
    avg_buses_per_day: float
    busiest_stop_name: str
    busiest_stop_buses: int
    routes_on_congested_roads: int


class CorridorRouteResponse(BaseModel):
    route_id: str
    short_name: str
    long_name: str
    overlap_description: str

    model_config = {"from_attributes": True}


class CorridorResponse(BaseModel):
    road_code: str
    routes: list[CorridorRouteResponse]
    route_count: int


class TransitCorridorsResponse(BaseModel):
    corridors: list[CorridorResponse]
    total_roads: int
    total_route_overlaps: int


class TramStopResponse(BaseModel):
    id: int
    stop_id: str
    name: str
    lat: float
    lon: float
    trams_dia: int | None = None
    rutas_count: int | None = None

    model_config = {"from_attributes": True}


class TramRouteResponse(BaseModel):
    id: int
    route_id: str
    short_name: str
    long_name: str
    color: str

    model_config = {"from_attributes": True}


class TramSummaryResponse(BaseModel):
    total_stops: int
    total_routes: int
    avg_trams_per_day: float
    busiest_stop_name: str
    busiest_stop_trams: int
    network_km: float  # hardcoded: 16.1 km
    annual_passengers: int  # hardcoded: ~25M


class TramStopsResponse(BaseModel):
    stops: list[TramStopResponse]
    total: int


class TransitStudyResponse(BaseModel):
    """Comprehensive transit study combining all transport modes."""

    # Bus (TITSA) summary
    bus_stops: int
    bus_routes: int
    bus_avg_frequency: float
    bus_annual_passengers: int
    # Tram summary
    tram_stops: int
    tram_routes: int
    tram_avg_frequency: float
    tram_annual_passengers: int
    tram_network_km: float
    # Taxi
    taxi_licenses_canarias: int
    taxi_licenses_sc_tenerife: int
    taxi_adapted_pmr: int
    # VTC
    vtc_licenses_active: int
    vtc_operator: str
    vtc_coverage: str
    vtc_blocked_applications: int
    # Island context
    motorization_index: float
    population: int
    annual_tourists: int
    # Combined
    total_public_transport_passengers: int  # bus + tram
    alternatives_verdict: str
