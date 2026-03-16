from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.estacion_aforo import EstacionAforo
from app.schemas.traffic import (
    StationResponse,
    TrafficResponse,
    TrafficYearsResponse,
)

router = APIRouter(tags=["traffic"])


def _station_to_response(s: EstacionAforo) -> StationResponse:
    return StationResponse(
        id=s.id,
        year=s.anio,
        road=s.carretera or "",
        section=s.tramo or "",
        station_id=s.estacion_id or 0,
        station_name=s.estacion_nombre or "",
        imd_total=s.imd_total,
        imd_ascending=s.imd_ascendentes,
        imd_descending=s.imd_descendentes,
        imd_heavy=s.imd_pesados,
        avg_speed=s.velocidad_media,
    )


def _build_roads_summary(db: Session, year: int) -> list[dict]:
    """Build summary with max IMD and station count per road for a given year."""
    rows = (
        db.query(
            EstacionAforo.carretera,
            func.max(EstacionAforo.imd_total).label("max_imd"),
            func.count(EstacionAforo.id).label("stations"),
        )
        .filter(EstacionAforo.anio == year)
        .group_by(EstacionAforo.carretera)
        .order_by(func.max(EstacionAforo.imd_total).desc())
        .all()
    )
    return [
        {"road": row.carretera, "max_imd": row.max_imd, "stations": row.stations}
        for row in rows
    ]


@router.get("/traffic", response_model=TrafficResponse)
def list_traffic_stations(
    year: int | None = None,
    db: Session = Depends(get_db),
):
    """Return all stations for a given year (default: latest available)."""
    if year is None:
        latest = db.query(func.max(EstacionAforo.anio)).scalar()
        year = latest or 0

    stations = (
        db.query(EstacionAforo)
        .filter(EstacionAforo.anio == year)
        .order_by(EstacionAforo.carretera, EstacionAforo.estacion_id)
        .all()
    )

    return TrafficResponse(
        stations=[_station_to_response(s) for s in stations],
        total=len(stations),
        year=year,
        roads_summary=_build_roads_summary(db, year),
    )


@router.get("/traffic/years", response_model=TrafficYearsResponse)
def list_traffic_years(db: Session = Depends(get_db)):
    """Return list of available years."""
    rows = (
        db.query(EstacionAforo.anio)
        .distinct()
        .order_by(EstacionAforo.anio.desc())
        .all()
    )
    return TrafficYearsResponse(available_years=[row.anio for row in rows])


@router.get("/traffic/road/{road_code}", response_model=TrafficResponse)
def list_traffic_by_road(
    road_code: str,
    year: int | None = None,
    db: Session = Depends(get_db),
):
    """Return stations for a specific road (e.g., TF-5)."""
    if year is None:
        latest = db.query(func.max(EstacionAforo.anio)).scalar()
        year = latest or 0

    stations = (
        db.query(EstacionAforo)
        .filter(EstacionAforo.anio == year, EstacionAforo.carretera == road_code)
        .order_by(EstacionAforo.estacion_id)
        .all()
    )

    return TrafficResponse(
        stations=[_station_to_response(s) for s in stations],
        total=len(stations),
        year=year,
        roads_summary=_build_roads_summary(db, year),
    )
