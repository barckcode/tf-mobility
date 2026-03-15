from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.estadistica import EstadisticaClave
from app.schemas.stats import StatsResponse

router = APIRouter(tags=["stats"])


def _get_stat(db: Session, key: str) -> str:
    row = db.query(EstadisticaClave).filter_by(clave=key).first()
    return row.valor if row else "0"


def _get_source(db: Session, key: str) -> str:
    row = db.query(EstadisticaClave).filter_by(clave=key).first()
    return row.fuente if row else ""


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """Key statistics for the hero section."""
    return StatsResponse(
        registered_cars=int(_get_stat(db, "turismos_registrados")),
        total_vehicles=int(_get_stat(db, "vehiculos_totales")),
        cars_per_km2=float(_get_stat(db, "coches_por_km2")),
        population=int(_get_stat(db, "poblacion")),
        motorization_index=int(_get_stat(db, "indice_motorizacion")),
        island_area_km2=float(_get_stat(db, "superficie_km2")),
        data_year=int(_get_stat(db, "anio_datos")),
        sources={
            "registered_cars": _get_source(db, "turismos_registrados"),
            "total_vehicles": _get_source(db, "vehiculos_totales"),
            "population": _get_source(db, "poblacion"),
            "motorization_index": _get_source(db, "indice_motorizacion"),
            "cars_per_km2": _get_source(db, "coches_por_km2"),
        },
    )
