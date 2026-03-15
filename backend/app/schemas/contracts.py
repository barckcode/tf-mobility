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
