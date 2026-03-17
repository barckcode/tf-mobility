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
    ContractsTransparencyResponse,
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
        cif_adjudicatario=getattr(c, 'cif_adjudicatario', None),
        num_ofertas=getattr(c, 'num_ofertas', None),
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

    rankings = []
    for e in companies:
        # Compute average competitors for this company
        avg_comp = (
            db.query(func.avg(Contrato.num_ofertas))
            .filter(Contrato.adjudicatario == e.nombre)
            .filter(Contrato.num_ofertas.isnot(None))
            .scalar()
        )
        rankings.append(CompanyRanking(
            company=e.nombre,
            cif=e.cif,
            total_amount=e.importe_total or 0.0,
            contract_count=e.num_contratos or 0,
            avg_competitors=round(float(avg_comp), 1) if avg_comp else None,
        ))

    return RankingsResponse(top_companies=rankings)


@router.get("/contracts/transparency", response_model=ContractsTransparencyResponse)
def get_transparency(db: Session = Depends(get_db)):
    """Comprehensive transparency analysis of mobility contracts."""
    total = db.query(Contrato).count()
    total_awarded = db.query(func.sum(Contrato.importe_adjudicacion)).scalar() or 0.0

    # Competition metrics
    avg_competitors = db.query(func.avg(Contrato.num_ofertas)).filter(
        Contrato.num_ofertas.isnot(None)
    ).scalar() or 0.0

    single_bidder = db.query(Contrato).filter(Contrato.num_ofertas == 1).count()
    single_bidder_pct = (single_bidder / total * 100) if total > 0 else 0.0

    # Top companies
    companies = (
        db.query(Empresa)
        .filter(Empresa.importe_total > 0)
        .order_by(Empresa.importe_total.desc())
        .limit(15)
        .all()
    )

    top_companies = []
    for e in companies:
        avg_comp = (
            db.query(func.avg(Contrato.num_ofertas))
            .filter(Contrato.adjudicatario == e.nombre)
            .filter(Contrato.num_ofertas.isnot(None))
            .scalar()
        )
        top_companies.append(CompanyRanking(
            company=e.nombre,
            cif=e.cif,
            total_amount=e.importe_total or 0.0,
            contract_count=e.num_contratos or 0,
            avg_competitors=round(float(avg_comp), 1) if avg_comp else None,
        ))

    # Concentration
    top5_amount = sum(c.total_amount for c in top_companies[:5])
    top10_amount = sum(c.total_amount for c in top_companies[:10])
    concentration_top5 = (top5_amount / total_awarded * 100) if total_awarded > 0 else 0.0
    concentration_top10 = (top10_amount / total_awarded * 100) if total_awarded > 0 else 0.0

    # Savings (licitacion vs adjudicacion)
    savings_rows = (
        db.query(Contrato.importe_licitacion, Contrato.importe_adjudicacion)
        .filter(Contrato.importe_licitacion.isnot(None))
        .filter(Contrato.importe_adjudicacion.isnot(None))
        .filter(Contrato.importe_licitacion > 0)
        .all()
    )
    if savings_rows:
        savings_pcts = [
            (r[0] - r[1]) / r[0] * 100 for r in savings_rows if r[0] > 0
        ]
        savings_avg = sum(savings_pcts) / len(savings_pcts) if savings_pcts else 0.0
    else:
        savings_avg = 0.0

    # By year
    by_year_rows = (
        db.query(
            func.strftime("%Y", Contrato.fecha_adjudicacion).label("year"),
            func.count(Contrato.id).label("count"),
            func.sum(Contrato.importe_adjudicacion).label("amount"),
        )
        .filter(Contrato.fecha_adjudicacion.isnot(None))
        .group_by(func.strftime("%Y", Contrato.fecha_adjudicacion))
        .order_by(func.strftime("%Y", Contrato.fecha_adjudicacion))
        .all()
    )
    by_year = [{"year": int(r.year), "count": r.count, "amount": r.amount or 0.0} for r in by_year_rows if r.year]

    # By type
    by_type_rows = (
        db.query(Contrato.tipo, func.count(Contrato.id).label("count"))
        .filter(Contrato.tipo.isnot(None))
        .group_by(Contrato.tipo)
        .order_by(func.count(Contrato.id).desc())
        .all()
    )
    by_type = [{"type": r.tipo, "count": r.count} for r in by_type_rows]

    return ContractsTransparencyResponse(
        total_contracts=total,
        total_awarded_amount=total_awarded,
        avg_competitors_per_contract=round(float(avg_competitors), 1),
        contracts_single_bidder=single_bidder,
        contracts_single_bidder_pct=round(single_bidder_pct, 1),
        top_companies=top_companies,
        contracts_by_year=by_year,
        contracts_by_type=by_type,
        concentration_top5_pct=round(concentration_top5, 1),
        concentration_top10_pct=round(concentration_top10, 1),
        savings_avg_pct=round(savings_avg, 1),
        disclaimer="Esta información es pública y se presenta con fines de transparencia. No se implica irregularidad alguna. Todos los datos proceden de la Plataforma de Contratación del Sector Público (PLACSP).",
    )
