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
