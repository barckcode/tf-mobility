import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.contrato import Contrato
from app.models.empresa import Empresa
from app.schemas.contracts import (
    ContractResponse,
    ContractsListResponse,
    CompanyRanking,
    RankingsResponse,
    ContractsSummaryResponse,
)

router = APIRouter(tags=["contracts"])


def _contract_to_response(c: Contrato) -> ContractResponse:
    return ContractResponse(
        id=c.id,
        expediente=c.expediente or "",
        objeto=c.objeto or "",
        tipo=c.tipo or "",
        importe_licitacion=c.importe_licitacion or 0.0,
        importe_adjudicacion=c.importe_adjudicacion or 0.0,
        adjudicatario=c.adjudicatario or "",
        fecha=str(c.fecha_adjudicacion or c.fecha_publicacion or ""),
        estado=c.estado or "",
        carreteras=[c.carretera] if c.carretera else [],
        source_url=c.url_fuente,
    )


@router.get("/contracts", response_model=ContractsListResponse)
def list_contracts(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    road: str | None = None,
    company: str | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
    year: int | None = None,
    tipo: str | None = Query(None, alias="type"),
    status: str | None = None,
    db: Session = Depends(get_db),
):
    """List contracts with filtering and pagination."""
    query = db.query(Contrato)

    if road:
        query = query.filter(Contrato.carretera == road)
    if company:
        query = query.filter(Contrato.adjudicatario.ilike(f"%{company}%"))
    if min_amount is not None:
        query = query.filter(Contrato.importe_adjudicacion >= min_amount)
    if max_amount is not None:
        query = query.filter(Contrato.importe_adjudicacion <= max_amount)
    if year:
        query = query.filter(
            func.strftime("%Y", Contrato.fecha_publicacion) == str(year)
        )
    if tipo:
        query = query.filter(Contrato.tipo == tipo)
    if status:
        query = query.filter(Contrato.estado == status)

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size

    contracts = (
        query.order_by(Contrato.fecha_publicacion.desc())
        .offset(offset)
        .limit(size)
        .all()
    )

    return ContractsListResponse(
        items=[_contract_to_response(c) for c in contracts],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/contracts/summary", response_model=ContractsSummaryResponse)
def get_contracts_summary(db: Session = Depends(get_db)):
    """Aggregated summary of all contracts."""
    total_contracts = db.query(Contrato).count()

    total_licitacion = (
        db.query(func.sum(Contrato.importe_licitacion)).scalar() or 0.0
    )
    total_adjudicacion = (
        db.query(func.sum(Contrato.importe_adjudicacion)).scalar() or 0.0
    )

    # Contracts by year
    by_year_rows = (
        db.query(
            func.strftime("%Y", Contrato.fecha_publicacion).label("year"),
            func.count(Contrato.id).label("count"),
            func.sum(Contrato.importe_adjudicacion).label("amount"),
        )
        .filter(Contrato.fecha_publicacion.isnot(None))
        .group_by(func.strftime("%Y", Contrato.fecha_publicacion))
        .order_by(func.strftime("%Y", Contrato.fecha_publicacion).desc())
        .all()
    )
    contracts_by_year = [
        {"year": int(r.year), "count": r.count, "amount": r.amount or 0.0}
        for r in by_year_rows
        if r.year
    ]

    # Contracts by type
    by_type_rows = (
        db.query(
            Contrato.tipo,
            func.count(Contrato.id).label("count"),
        )
        .filter(Contrato.tipo.isnot(None))
        .group_by(Contrato.tipo)
        .order_by(func.count(Contrato.id).desc())
        .all()
    )
    contracts_by_type = [
        {"type": r.tipo, "count": r.count} for r in by_type_rows
    ]

    # Contracts by status
    by_status_rows = (
        db.query(
            Contrato.estado,
            func.count(Contrato.id).label("count"),
        )
        .filter(Contrato.estado.isnot(None))
        .group_by(Contrato.estado)
        .order_by(func.count(Contrato.id).desc())
        .all()
    )
    contracts_by_status = [
        {"status": r.estado, "count": r.count} for r in by_status_rows
    ]

    # Top roads
    top_roads_rows = (
        db.query(
            Contrato.carretera,
            func.count(Contrato.id).label("count"),
        )
        .filter(Contrato.carretera.isnot(None))
        .group_by(Contrato.carretera)
        .order_by(func.count(Contrato.id).desc())
        .limit(20)
        .all()
    )
    top_roads = [
        {"road": r.carretera, "count": r.count} for r in top_roads_rows
    ]

    return ContractsSummaryResponse(
        total_contracts=total_contracts,
        total_licitacion_amount=total_licitacion,
        total_adjudicacion_amount=total_adjudicacion,
        contracts_by_year=contracts_by_year,
        contracts_by_type=contracts_by_type,
        contracts_by_status=contracts_by_status,
        top_roads=top_roads,
    )


@router.get("/contracts/rankings", response_model=RankingsResponse)
def get_rankings(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Top companies by total awarded contract amount."""
    companies = (
        db.query(Empresa)
        .filter(Empresa.importe_total > 0)
        .order_by(Empresa.importe_total.desc())
        .limit(limit)
        .all()
    )

    return RankingsResponse(
        top_companies=[
            CompanyRanking(
                company=e.nombre,
                total_amount=e.importe_total or 0.0,
                contract_count=e.num_contratos or 0,
            )
            for e in companies
        ]
    )
