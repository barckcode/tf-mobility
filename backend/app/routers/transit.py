from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import defaultdict

from app.database import get_db
from app.models.parada_guagua import ParadaGuagua
from app.models.ruta_guagua import RutaGuagua
from app.models.frecuencia_parada import FrecuenciaParada
from app.models.ruta_tramo import RutaTramo
from app.models.parada_tranvia import ParadaTranvia
from app.models.ruta_tranvia import RutaTranvia
from app.models.frecuencia_tranvia import FrecuenciaTranvia
from app.schemas.transit import (
    BusStopResponse,
    BusRouteResponse,
    TransitStopsResponse,
    TransitRoutesResponse,
    TransitSummaryResponse,
    CorridorRouteResponse,
    CorridorResponse,
    TransitCorridorsResponse,
    TramStopResponse,
    TramSummaryResponse,
    TramStopsResponse,
    TransitStudyResponse,
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


@router.get("/transit/tram/summary", response_model=TramSummaryResponse)
def tram_summary(db: Session = Depends(get_db)):
    """Tram system KPIs."""
    total_stops = db.query(func.count(ParadaTranvia.id)).scalar() or 0
    total_routes = db.query(func.count(RutaTranvia.id)).scalar() or 0
    avg_trams = db.query(func.avg(FrecuenciaTranvia.trams_dia)).scalar() or 0.0

    busiest_freq = (
        db.query(FrecuenciaTranvia)
        .order_by(FrecuenciaTranvia.trams_dia.desc())
        .first()
    )
    busiest_name = ""
    busiest_trams = 0
    if busiest_freq:
        busiest_trams = busiest_freq.trams_dia or 0
        stop = db.query(ParadaTranvia).filter_by(stop_id=busiest_freq.stop_id).first()
        busiest_name = stop.name if stop else busiest_freq.stop_id

    return TramSummaryResponse(
        total_stops=total_stops,
        total_routes=total_routes,
        avg_trams_per_day=round(float(avg_trams), 1),
        busiest_stop_name=busiest_name,
        busiest_stop_trams=busiest_trams,
        network_km=16.1,
        annual_passengers=25000000,
    )


@router.get("/transit/tram/stops", response_model=TramStopsResponse)
def list_tram_stops(db: Session = Depends(get_db)):
    """Return all tram stops with frequency data."""
    stops = db.query(ParadaTranvia).order_by(ParadaTranvia.stop_id).all()
    frequencies = db.query(FrecuenciaTranvia).all()
    freq_map = {f.stop_id: f for f in frequencies}

    return TramStopsResponse(
        stops=[
            TramStopResponse(
                id=s.id,
                stop_id=s.stop_id,
                name=s.name or "",
                lat=s.lat or 0.0,
                lon=s.lon or 0.0,
                trams_dia=freq_map[s.stop_id].trams_dia if s.stop_id in freq_map else None,
                rutas_count=freq_map[s.stop_id].rutas_count if s.stop_id in freq_map else None,
            )
            for s in stops
        ],
        total=len(stops),
    )


@router.get("/transit/study", response_model=TransitStudyResponse)
def transit_study(db: Session = Depends(get_db)):
    """Comprehensive transit study combining all transport modes."""
    # Bus data
    bus_stops = db.query(func.count(ParadaGuagua.id)).scalar() or 0
    bus_routes = db.query(func.count(RutaGuagua.id)).scalar() or 0
    bus_avg = db.query(func.avg(FrecuenciaParada.buses_dia)).scalar() or 0.0

    # Tram data
    tram_stops = db.query(func.count(ParadaTranvia.id)).scalar() or 0
    tram_routes = db.query(func.count(RutaTranvia.id)).scalar() or 0
    tram_avg = db.query(func.avg(FrecuenciaTranvia.trams_dia)).scalar() or 0.0

    return TransitStudyResponse(
        bus_stops=bus_stops,
        bus_routes=bus_routes,
        bus_avg_frequency=round(float(bus_avg), 1),
        bus_annual_passengers=80000000,
        tram_stops=tram_stops,
        tram_routes=tram_routes,
        tram_avg_frequency=round(float(tram_avg), 1),
        tram_annual_passengers=25000000,
        tram_network_km=16.1,
        taxi_licenses_canarias=2266,
        taxi_licenses_sc_tenerife=900,
        taxi_adapted_pmr=11,
        vtc_licenses_active=89,
        vtc_operator="Uber",
        vtc_coverage="Zona sur: Adeje, Arona, Granadilla, Guía de Isora, Aeropuerto Sur",
        vtc_blocked_applications=9000,
        motorization_index=839.0,
        population=1007641,
        annual_tourists=7412046,
        total_public_transport_passengers=105000000,
        alternatives_verdict=(
            "El transporte público (guaguas + tranvía) mueve ~105M pasajeros/año, "
            "pero con un índice de motorización de 839 vehículos/1.000 habitantes, "
            "el vehículo privado sigue siendo la única alternativa viable para la "
            "mayoría de la población."
        ),
    )
