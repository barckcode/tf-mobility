from pydantic import BaseModel


class ContractResponse(BaseModel):
    id: int
    expediente: str
    objeto: str
    tipo: str
    importe_licitacion: float
    importe_adjudicacion: float
    adjudicatario: str
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
    total_amount: float
    contract_count: int


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
