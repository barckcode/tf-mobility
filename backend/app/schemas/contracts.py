from pydantic import BaseModel


class ContractResponse(BaseModel):
    id: int
    expediente: str
    objeto: str
    tipo: str
    importe_licitacion: float
    importe_adjudicacion: float
    adjudicatario: str
    cif_adjudicatario: str | None = None
    num_ofertas: int | None = None
    fecha: str
    estado: str
    carreteras: list[str]
    source_url: str | None = None

    model_config = {"from_attributes": True}


class ContractsListResponse(BaseModel):
    items: list[ContractResponse]
    total: int
    page: int
    size: int
    pages: int


class CompanyRanking(BaseModel):
    company: str
    cif: str | None = None
    total_amount: float
    contract_count: int
    avg_competitors: float | None = None  # average num_ofertas across their contracts


class RankingsResponse(BaseModel):
    top_companies: list[CompanyRanking]


class ContractsSummaryResponse(BaseModel):
    total_contracts: int
    total_licitacion_amount: float
    total_adjudicacion_amount: float
    contracts_by_year: list[dict]  # [{year: 2024, count: 150, amount: 50000000}]
    contracts_by_type: list[dict]  # [{type: "obras", count: 200}]
    contracts_by_status: list[dict]  # [{status: "adjudicado", count: 100}]
    top_roads: list[dict]  # [{road: "TF-5", count: 20}]


class ContractsTransparencyResponse(BaseModel):
    """Full transparency analysis of mobility contracts."""
    total_contracts: int
    total_awarded_amount: float
    avg_competitors_per_contract: float
    contracts_single_bidder: int  # contracts with only 1 offer
    contracts_single_bidder_pct: float
    top_companies: list[CompanyRanking]
    contracts_by_year: list[dict]
    contracts_by_type: list[dict]
    concentration_top5_pct: float  # % of total amount going to top 5 companies
    concentration_top10_pct: float  # % going to top 10
    savings_avg_pct: float  # average (licitacion - adjudicacion) / licitacion
    disclaimer: str


class DirectorInfo(BaseModel):
    name: str
    role: str
    source: str


class PublicConnection(BaseModel):
    description: str
    source_name: str
    source_url: str


class CompanyDirectorsResponse(BaseModel):
    company: str
    cif: str | None = None
    total_contracts: int
    total_amount: float
    directors: list[DirectorInfo]
    public_connections: list[PublicConnection]
    cnmc_sanction: str | None = None  # CNMC cartel sanction if applicable
    cnmc_sanction_url: str | None = None
    judicial_cases: str | None = None  # Public judicial cases if applicable
    judicial_cases_url: str | None = None
    confidence_level: str  # alto, medio, bajo


class DirectorsTransparencyResponse(BaseModel):
    companies: list[CompanyDirectorsResponse]
    methodology: str
    disclaimer: str
    last_updated: str
    sources_count: int
