from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alternativa import Alternativa
from app.schemas.alternatives import (
    AlternativeResponse,
    AlternativesListResponse,
)

router = APIRouter(tags=["alternatives"])


def _alt_to_response(a: Alternativa) -> AlternativeResponse:
    return AlternativeResponse(
        id=a.id,
        name=a.nombre or "",
        type=a.tipo or "",
        status=a.estado or "",
        operator=a.operador or "",
        coverage=a.cobertura or "",
        annual_users=a.usuarios_anuales or 0,
        key_fact=a.dato_clave or "",
        description=a.descripcion or "",
        color=a.color or "#6C757D",
        icon=a.icono or "info",
        source_url=a.url_fuente,
    )


@router.get("/alternatives", response_model=AlternativesListResponse)
def list_alternatives(db: Session = Depends(get_db)):
    """List all transport alternatives to private car."""
    alternatives = db.query(Alternativa).order_by(Alternativa.id).all()

    # Count by type
    summary = {}
    for a in alternatives:
        tipo = a.tipo or "other"
        summary[tipo] = summary.get(tipo, 0) + 1

    return AlternativesListResponse(
        alternatives=[_alt_to_response(a) for a in alternatives],
        summary=summary,
    )
