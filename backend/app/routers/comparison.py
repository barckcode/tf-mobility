from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.comparativa import ComparativaIsla
from app.schemas.comparison import (
    IslandComparison,
    ComparisonResponse,
)

router = APIRouter(tags=["comparison"])


def _island_to_response(i: ComparativaIsla) -> IslandComparison:
    return IslandComparison(
        id=i.id,
        island=i.isla or "",
        community=i.comunidad or "",
        population=i.poblacion or 0,
        area_km2=i.superficie_km2 or 0.0,
        annual_tourists=i.turistas_anuales or 0,
        tourist_resident_ratio=i.ratio_turistas_habitante or 0.0,
        registered_vehicles=i.vehiculos_registrados or 0,
        cars_per_km2=i.coches_por_km2 or 0.0,
        road_investment_m_eur=i.inversion_carreteras_m_eur or 0.0,
        road_km=i.km_carreteras or 0.0,
        has_train=i.tiene_tren or "no",
        has_tram=i.tiene_tranvia or "no",
        traffic_regulation=i.regulacion_trafico or "",
        source=i.fuente or "",
    )


@router.get("/comparison", response_model=ComparisonResponse)
def get_comparison(db: Session = Depends(get_db)):
    """Comparative data across Canary Islands and reference islands."""
    all_islands = db.query(ComparativaIsla).order_by(ComparativaIsla.isla).all()

    if not all_islands:
        return ComparisonResponse(
            islands=[], canary_islands=[], reference_islands=[],
            highlights={"status": "No data loaded yet — ETL pipeline pending"},
        )

    canary = [i for i in all_islands if i.comunidad == "Canarias"]
    reference = [i for i in all_islands if i.comunidad != "Canarias"]

    # Compute highlights
    tenerife = next((i for i in all_islands if i.isla == "Tenerife"), None)
    max_ratio = max(all_islands, key=lambda x: x.ratio_turistas_habitante or 0)
    max_density = max(all_islands, key=lambda x: x.coches_por_km2 or 0)
    regulated = [i for i in all_islands if i.regulacion_trafico and not i.regulacion_trafico.startswith("No")]

    highlights = {
        "tenerife_tourists": f"{tenerife.turistas_anuales:,}" if tenerife else "N/A",
        "tenerife_vehicles": f"{tenerife.vehiculos_registrados:,}" if tenerife else "N/A",
        "tenerife_cars_per_km2": f"{tenerife.coches_por_km2:.1f}" if tenerife else "N/A",
        "highest_tourist_ratio": f"{max_ratio.isla}: {max_ratio.ratio_turistas_habitante:.1f} tourists/resident",
        "highest_car_density": f"{max_density.isla}: {max_density.coches_por_km2:.1f} cars/km²",
        "islands_with_regulation": ", ".join(i.isla for i in regulated),
        "canary_islands_without_regulation": "None of the Canary Islands have specific vehicle regulation for tourists",
    }

    return ComparisonResponse(
        islands=[_island_to_response(i) for i in all_islands],
        canary_islands=[_island_to_response(i) for i in canary],
        reference_islands=[_island_to_response(i) for i in reference],
        highlights=highlights,
    )
