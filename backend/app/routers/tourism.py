from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.turismo import TurismoMensual
from app.models.estadistica import EstadisticaClave
from app.schemas.tourism import (
    MonthlyTourism,
    TourismListResponse,
    TourismStatsResponse,
    IslandRegulation,
)

router = APIRouter(tags=["tourism"])


def _tourism_to_response(t: TurismoMensual) -> MonthlyTourism:
    return MonthlyTourism(
        year=t.anio,
        month=t.mes,
        tourists=t.turistas,
        island=t.isla or "Tenerife",
        source=t.fuente or "",
    )


def _get_stat(db: Session, key: str) -> str:
    row = db.query(EstadisticaClave).filter_by(clave=key).first()
    return row.valor if row else "0"


def _get_source(db: Session, key: str) -> str:
    row = db.query(EstadisticaClave).filter_by(clave=key).first()
    return row.fuente if row else ""


@router.get("/tourism/monthly", response_model=TourismListResponse)
@router.get("/tourism", response_model=TourismListResponse)
def list_tourism(
    year: int | None = None,
    db: Session = Depends(get_db),
):
    """Monthly tourist arrivals data."""
    query = db.query(TurismoMensual)
    if year:
        query = query.filter(TurismoMensual.anio == year)
    records = query.order_by(TurismoMensual.anio, TurismoMensual.mes).all()

    return TourismListResponse(
        data=[_tourism_to_response(t) for t in records],
        total_records=len(records),
    )


@router.get("/tourism/stats", response_model=TourismStatsResponse)
def get_tourism_stats(db: Session = Depends(get_db)):
    """Tourism summary stats including regulations comparison."""
    # Get all monthly data
    records = (
        db.query(TurismoMensual)
        .order_by(TurismoMensual.anio, TurismoMensual.mes)
        .all()
    )

    # Build regulations list
    regulation_keys = [
        ("Formentera", "regulacion_formentera"),
        ("Ibiza", "regulacion_ibiza"),
        ("Mallorca", "regulacion_mallorca"),
        ("Azores", "regulacion_azores"),
        ("Madeira", "regulacion_madeira"),
        ("Canarias (Tenerife)", "regulacion_canarias"),
    ]
    regulations = []
    for island, key in regulation_keys:
        row = db.query(EstadisticaClave).filter_by(clave=key).first()
        if row:
            regulations.append(IslandRegulation(
                island=island,
                has_regulation=not row.valor.startswith("No"),
                description=row.valor,
                source=row.fuente or "",
            ))

    return TourismStatsResponse(
        annual_tourists_2024=int(_get_stat(db, "turistas_anuales_2024")),
        annual_tourists_2023=int(_get_stat(db, "turistas_anuales")),
        rental_cars_canarias=int(_get_stat(db, "vehiculos_alquiler_canarias")),
        rental_cars_tenerife=int(_get_stat(db, "vehiculos_alquiler")),
        avg_daily_spend_eur=float(_get_stat(db, "gasto_diario_turista")),
        avg_stay_days=float(_get_stat(db, "estancia_media_turista")),
        monthly_data=[_tourism_to_response(t) for t in records],
        regulations=regulations,
        sources={
            "annual_tourists": _get_source(db, "turistas_anuales_2024"),
            "rental_cars": _get_source(db, "vehiculos_alquiler_canarias"),
            "avg_daily_spend": _get_source(db, "gasto_diario_turista"),
            "avg_stay": _get_source(db, "estancia_media_turista"),
        },
    )
