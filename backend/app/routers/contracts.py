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
    DirectorInfo,
    PublicConnection,
    CompanyDirectorsResponse,
    DirectorsTransparencyResponse,
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


@router.get("/contracts/directors", response_model=DirectorsTransparencyResponse)
def get_directors_transparency():
    """Directors and public connections of top mobility contract companies.

    Data sourced from BORME (public registry), CNMC decisions, and press coverage.
    All information is publicly available.
    """
    companies = [
        CompanyDirectorsResponse(
            company="TRANSFORMACIONES Y SERVICIOS, S.L. (TRAYSESA / Grupo SOAC)",
            cif="B38044301",
            total_contracts=15,
            total_amount=26927243.05,
            directors=[
                DirectorInfo(name="Miguel Concepción Cáceres", role="Propietario (Grupo SOAC)", source="BORME / Wikipedia"),
                DirectorInfo(name="José Francisco Mares Solaz", role="Administrador Único (desde 2023)", source="BORME / Empresia"),
            ],
            public_connections=[
                PublicConnection(
                    description="Miguel Concepción fue consejero del Cabildo Insular de Tenerife. Mantuvo relación pública documentada con Paulino Rivero, expresidente del Gobierno de Canarias (Coalición Canaria).",
                    source_name="elDiario.es / EnciclopediaGuanche",
                    source_url="https://www.eldiario.es/canariasahora/Deportes/futbol/miguel-concepcion-dejara-presidente-cd-tenerife-propone-sustituto-paulino-rivero_1_9556183.html",
                ),
                PublicConnection(
                    description="Concepción es propietario de Canal 4 Tenerife y Canal 11 La Palma (medios de comunicación).",
                    source_name="Wikipedia",
                    source_url="https://es.wikipedia.org/wiki/Miguel_Concepci%C3%B3n_C%C3%A1ceres",
                ),
            ],
            cnmc_sanction=None,
            judicial_cases="Condena de 23 meses de prisión por estafa continuada (caso Islas Airways, fraude descuento residente, 8,4M\u20ac). Ratificada por el Tribunal Supremo en 2023.",
            confidence_level="alto",
        ),
        CompanyDirectorsResponse(
            company="SACYR CONSTRUCCIÓN, SAU",
            cif="A78366382",
            total_contracts=1,
            total_amount=15404569.45,
            directors=[
                DirectorInfo(name="Manuel Manrique Cecilia", role="Presidente ejecutivo (desde 2011)", source="Sacyr web corporativa"),
                DirectorInfo(name="Demetrio Carceller Arce", role="1er Vicepresidente", source="Wikipedia"),
            ],
            public_connections=[
                PublicConnection(
                    description="Isabel Pardo de Vera, n\u00ba2 del Ministerio de Transportes (2021-2023), fue fichada por ACS/Sacyr con salario de 400.000\u20ac/a\u00f1o tras su salida del cargo.",
                    source_name="Diario Red",
                    source_url="https://www.diario-red.com/articulo/espana/isabel-pardo-vera-numero-dos-ministerio-transportes-fichar-florentino-perez-multinacional-acs/20250322060000044439.html",
                ),
            ],
            cnmc_sanction="Sacyr: 16,7M\u20ac (cartel obra civil, 2022). Sacyr Conservación: 5,17M\u20ac (cartel conservación carreteras, 2021). Sancionadas por alterar licitaciones durante 25 a\u00f1os.",
            judicial_cases=None,
            confidence_level="alto",
        ),
        CompanyDirectorsResponse(
            company="ASFALTOS Y OBRAS TAFURIASTE, S.L. (ASYOTA)",
            cif=None,
            total_contracts=3,
            total_amount=12555704.08,
            directors=[
                DirectorInfo(name="Cruz García Francisco Javier", role="Administrador Único", source="BORME / Empresite"),
                DirectorInfo(name="Isidro García García", role="Gerente (desde 2014)", source="LibreBor / BORME"),
            ],
            public_connections=[],
            cnmc_sanction=None,
            judicial_cases=None,
            confidence_level="medio",
        ),
        CompanyDirectorsResponse(
            company="OBRASCON HUARTE LAIN, S.A. (OHL/OHLA)",
            cif=None,
            total_contracts=1,
            total_amount=8786706.25,
            directors=[
                DirectorInfo(name="Luis Fernando Martín Amodio Herrera", role="Presidente ejecutivo (desde 2020)", source="OHLA web corporativa"),
                DirectorInfo(name="Juan Miguel Villar Mir (\u20202024)", role="Expresidente y fundador", source="Wikipedia / El Economista"),
            ],
            public_connections=[
                PublicConnection(
                    description="Juan Miguel Villar Mir fue Vicepresidente de Asuntos Econ\u00f3micos y Ministro de Hacienda (1975). Apareci\u00f3 en los 'papeles de B\u00e1rcenas' como constructor con donaciones al PP.",
                    source_name="elDiario.es",
                    source_url="https://www.eldiario.es/economia/villar-mir-empresario-construido-golpe-gangas-contactos-politicos_129_11505397.html",
                ),
            ],
            cnmc_sanction="21,5M\u20ac por cartel de obra civil (2022). Participaci\u00f3n en manipulaci\u00f3n de licitaciones durante 25 a\u00f1os (1992-2017).",
            judicial_cases=None,
            confidence_level="alto",
        ),
        CompanyDirectorsResponse(
            company="SANDO / CONACON (Grupo S\u00e1nchez Dom\u00ednguez Sando)",
            cif=None,
            total_contracts=2,
            total_amount=7917682.48,
            directors=[
                DirectorInfo(name="Jos\u00e9 Luis S\u00e1nchez Dom\u00ednguez", role="Fundador, Presidente de Honor", source="Wikipedia / BORME"),
                DirectorInfo(name="Esther S\u00e1nchez Manzano", role="Vicepresidenta ejecutiva", source="CTA / prensa"),
            ],
            public_connections=[
                PublicConnection(
                    description="Jos\u00e9 Luis S\u00e1nchez Dom\u00ednguez apareci\u00f3 en los 'papeles de B\u00e1rcenas' como el mayor donante al PP: 1,25 millones de euros (2002-2008). Fue imputado por el juez Ruz.",
                    source_name="Revista El Observador",
                    source_url="https://revistaelobservador.com/index.php/sociedad/sociedad/7562-el-presidente-de-la-constructora-malaguena-sando-jose-luis-sanchez-imputado-por-el-juez-ruz-para-que-explique-por-que-aparece-su-nombre-en-los-papeles-de-barcenas-como-el-autor-de-las-mayo",
                ),
                PublicConnection(
                    description="Juan Manuel Mu\u00f1oz, directivo de Sando, fue nombrado Comisionado de Cambio Clim\u00e1tico por la Junta de Andaluc\u00eda, pese a condena de la empresa por explotaci\u00f3n ilegal de cantera.",
                    source_name="elDiario.es",
                    source_url="https://www.eldiario.es/andalucia/junta-andalucia-nombra-maxima-autoridad-cambio-climatico-directivo-sando-condenado-explotacion-ilegal-cantera_1_6273084.html",
                ),
            ],
            cnmc_sanction=None,
            judicial_cases="Condena por cobrar trabajos no realizados en el Puerto de M\u00e1laga. Condena por explotaci\u00f3n ilegal de cantera.",
            confidence_level="alto",
        ),
        CompanyDirectorsResponse(
            company="DRAGADOS, S.A. (Grupo ACS)",
            cif=None,
            total_contracts=1,
            total_amount=5000000.0,
            directors=[
                DirectorInfo(name="Florentino P\u00e9rez Rodr\u00edguez", role="Presidente de ACS (matriz)", source="Grupo ACS web corporativa"),
                DirectorInfo(name="Santiago Garc\u00eda Salvador", role="Consejero Delegado Dragados (desde 2022)", source="BORME"),
            ],
            public_connections=[
                PublicConnection(
                    description="Florentino P\u00e9rez fue concejal del Ayto. de Madrid (UCD), Subdirector General del CDTI, y Director General de Infraestructuras del Transporte del Ministerio. 8 de 18 consejeros de ACS han tenido cargos p\u00fablicos.",
                    source_name="La Marea / YoIbexTigo",
                    source_url="https://www.yoibextigo.lamarea.com/informe/acs/quienes-son/las-puertas-giratorias-de-acs/",
                ),
                PublicConnection(
                    description="Isabel Pardo de Vera, n\u00ba2 del Ministerio de Transportes, fue fichada por ACS tras dejar el cargo p\u00fablico (400.000\u20ac/a\u00f1o).",
                    source_name="Diario Red",
                    source_url="https://www.diario-red.com/articulo/espana/isabel-pardo-vera-numero-dos-ministerio-transportes-fichar-florentino-perez-multinacional-acs/20250322060000044439.html",
                ),
            ],
            cnmc_sanction="57,1M\u20ac (la mayor sanci\u00f3n del cartel de obra civil, 2022). Participaci\u00f3n en manipulaci\u00f3n de miles de licitaciones durante 25 a\u00f1os.",
            judicial_cases=None,
            confidence_level="alto",
        ),
        CompanyDirectorsResponse(
            company="SE\u00d1ALIZACIONES VILLAR, S.A.",
            cif="A42004598",
            total_contracts=2,
            total_amount=3500000.0,
            directors=[
                DirectorInfo(name="Francisco Javier Medrano Villar", role="Presidente y Director General", source="BORME / Empresia"),
                DirectorInfo(name="Rafael Lasfuentes Villar", role="Consejero Delegado", source="DatosCIF / BORME"),
            ],
            public_connections=[],
            cnmc_sanction=None,
            judicial_cases=None,
            confidence_level="medio",
        ),
    ]

    return DirectorsTransparencyResponse(
        companies=companies,
        methodology="Datos obtenidos de fuentes p\u00fablicas: BORME (Bolet\u00edn Oficial del Registro Mercantil), resoluciones de la CNMC, sentencias judiciales publicadas, y cobertura period\u00edstica de medios de referencia. No se han utilizado fuentes privadas ni se ha accedido a informaci\u00f3n confidencial.",
        disclaimer="Esta informaci\u00f3n es p\u00fablica y se presenta exclusivamente con fines de transparencia ciudadana. La existencia de conexiones p\u00fablicas entre directivos empresariales y cargos pol\u00edticos no implica irregularidad alguna. Las sanciones de la CNMC y los casos judiciales mencionados son resoluciones firmes de organismos p\u00fablicos.",
        last_updated="2026-03-17",
        sources_count=19,
    )
