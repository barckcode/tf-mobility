from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import defaultdict

from app.database import get_db
from app.models.parada_guagua import ParadaGuagua
from app.models.ruta_guagua import RutaGuagua
from app.models.frecuencia_parada import FrecuenciaParada
from app.models.ruta_tramo import RutaTramo
from app.schemas.transit import (
    BusStopResponse,
    BusRouteResponse,
    TransitStopsResponse,
    TransitRoutesResponse,
    TransitSummaryResponse,
    CorridorRouteResponse,
    CorridorResponse,
    TransitCorridorsResponse,
)

router = APIRouter(tags=["transit"])


def _stop_to_response(stop: ParadaGuagua, freq: FrecuenciaParada | None) -> BusStopResponse:
    return BusStopResponse(
        id=stop.id,
        stop_id=stop.stop_id,
        name=stop.name or "",
        lat=stop.lat or 0.0,
        lon=stop.lon or 0.0,
        buses_dia=freq.buses_dia if freq else None,
        rutas_count=freq.rutas_count if freq else None,
    )


def _route_to_response(route: RutaGuagua, corridors: list[str]) -> BusRouteResponse:
    return BusRouteResponse(
        id=route.id,
        route_id=route.route_id,
        short_name=route.short_name or "",
        long_name=route.long_name or "",
        color=route.color or "",
        corridors=corridors,
    )


@router.get("/transit/stops", response_model=TransitStopsResponse)
def list_transit_stops(db: Session = Depends(get_db)):
    """Return all bus stops with frequency data."""
    stops = db.query(ParadaGuagua).order_by(ParadaGuagua.stop_id).all()

    # Build frequency lookup
    frequencies = db.query(FrecuenciaParada).all()
    freq_map = {f.stop_id: f for f in frequencies}

    return TransitStopsResponse(
        stops=[_stop_to_response(s, freq_map.get(s.stop_id)) for s in stops],
        total=len(stops),
    )


@router.get("/transit/routes", response_model=TransitRoutesResponse)
def list_transit_routes(db: Session = Depends(get_db)):
    """Return all bus routes with corridor info."""
    routes = db.query(RutaGuagua).order_by(RutaGuagua.short_name).all()

    # Build corridor lookup: route_id -> list of road codes
    tramos = db.query(RutaTramo).all()
    corridor_map: dict[str, list[str]] = defaultdict(list)
    for t in tramos:
        corridor_map[t.route_id].append(t.carretera)

    return TransitRoutesResponse(
        routes=[_route_to_response(r, corridor_map.get(r.route_id, [])) for r in routes],
        total=len(routes),
    )


@router.get("/transit/summary", response_model=TransitSummaryResponse)
def transit_summary(db: Session = Depends(get_db)):
    """Return KPIs: total stops, total routes, avg buses/day, busiest stop, routes on congested roads."""
    total_stops = db.query(func.count(ParadaGuagua.id)).scalar() or 0
    total_routes = db.query(func.count(RutaGuagua.id)).scalar() or 0

    avg_buses = db.query(func.avg(FrecuenciaParada.buses_dia)).scalar() or 0.0

    # Busiest stop
    busiest_freq = (
        db.query(FrecuenciaParada)
        .order_by(FrecuenciaParada.buses_dia.desc())
        .first()
    )

    busiest_name = ""
    busiest_buses = 0
    if busiest_freq:
        busiest_buses = busiest_freq.buses_dia or 0
        stop = db.query(ParadaGuagua).filter_by(stop_id=busiest_freq.stop_id).first()
        busiest_name = stop.name if stop else busiest_freq.stop_id

    # Routes on congested roads (distinct route_ids in rutas_tramo)
    routes_on_roads = (
        db.query(func.count(func.distinct(RutaTramo.route_id))).scalar() or 0
    )

    return TransitSummaryResponse(
        total_stops=total_stops,
        total_routes=total_routes,
        avg_buses_per_day=round(float(avg_buses), 1),
        busiest_stop_name=busiest_name,
        busiest_stop_buses=busiest_buses,
        routes_on_congested_roads=routes_on_roads,
    )


@router.get("/transit/corridors", response_model=TransitCorridorsResponse)
def transit_corridors(db: Session = Depends(get_db)):
    """Return routes grouped by TF-* corridor they serve."""
    tramos = db.query(RutaTramo).order_by(RutaTramo.carretera).all()

    # Group by road code
    road_groups: dict[str, list[RutaTramo]] = defaultdict(list)
    for t in tramos:
        road_groups[t.carretera].append(t)

    # Build route lookup for names
    route_ids = {t.route_id for t in tramos}
    routes = db.query(RutaGuagua).filter(RutaGuagua.route_id.in_(route_ids)).all()
    route_map = {r.route_id: r for r in routes}

    corridors = []
    total_overlaps = 0
    for road_code in sorted(road_groups.keys()):
        group = road_groups[road_code]
        corridor_routes = []
        for t in group:
            route = route_map.get(t.route_id)
            corridor_routes.append(CorridorRouteResponse(
                route_id=t.route_id,
                short_name=route.short_name if route else "",
                long_name=route.long_name if route else "",
                overlap_description=t.overlap_description or "",
            ))
        corridors.append(CorridorResponse(
            road_code=road_code,
            routes=corridor_routes,
            route_count=len(corridor_routes),
        ))
        total_overlaps += len(corridor_routes)

    return TransitCorridorsResponse(
        corridors=corridors,
        total_roads=len(corridors),
        total_route_overlaps=total_overlaps,
    )
