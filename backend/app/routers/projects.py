from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.proyecto import Proyecto
from app.models.contrato import Contrato
from app.schemas.projects import (
    ProjectResponse,
    ProjectSource,
    ProjectsSummary,
    ProjectsListResponse,
)

router = APIRouter(tags=["projects"])

# Map internal estado (verde/amarillo/rojo) to frontend status codes
STATUS_MAP = {
    "verde": "en_plazo",
    "amarillo": "retrasado",
    "rojo": "paralizado",
}


def _project_to_response(p: Proyecto, db: Session) -> ProjectResponse:
    # Build sources list
    sources = []
    if p.url_fuente:
        sources.append(ProjectSource(
            label=f"Fuente oficial - {p.responsable or 'Cabildo de Tenerife'}",
            url=p.url_fuente,
        ))

    # Find related contracts by matching project name keywords in contract objects
    related = []
    name_parts = p.nombre.split()
    # Look for contracts mentioning key project terms
    for part in name_parts:
        if len(part) > 3 and part.upper().startswith("TF-"):
            matches = (
                db.query(Contrato.expediente)
                .filter(Contrato.carretera == part.upper())
                .all()
            )
            related.extend([m[0] for m in matches])

    return ProjectResponse(
        id=p.id,
        name=p.nombre,
        description=p.descripcion or "",
        announced_date=str(p.fecha_inicio or ""),
        promised_date=str(p.fecha_fin_prevista or ""),
        status=STATUS_MAP.get(p.estado, p.estado),
        responsible_entity=p.responsable or "",
        sources=sources,
        related_contracts=list(set(related)),
        last_update=str(p.fecha_inicio or ""),
        budget=p.presupuesto,
        phase=p.fase or "",
        progress=p.porcentaje_avance or 0.0,
        notes=p.notas,
    )


@router.get("/projects", response_model=ProjectsListResponse)
def list_projects(db: Session = Depends(get_db)):
    """List all tracked projects with status summary."""
    projects = db.query(Proyecto).order_by(Proyecto.id).all()

    on_track = sum(1 for p in projects if p.estado == "verde")
    delayed = sum(1 for p in projects if p.estado == "amarillo")
    stalled = sum(1 for p in projects if p.estado == "rojo")

    return ProjectsListResponse(
        projects=[_project_to_response(p, db) for p in projects],
        summary=ProjectsSummary(
            on_track=on_track,
            delayed=delayed,
            stalled=stalled,
        ),
    )


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get a single project by ID."""
    project = db.query(Proyecto).filter_by(id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _project_to_response(project, db)
