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
