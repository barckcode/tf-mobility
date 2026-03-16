from pydantic import BaseModel


class AlternativeResponse(BaseModel):
    id: int
    name: str
    type: str
    status: str
    operator: str
    coverage: str
    annual_users: int
    key_fact: str
    description: str
    color: str
    icon: str
    source_url: str | None = None

    model_config = {"from_attributes": True}


class AlternativesListResponse(BaseModel):
    alternatives: list[AlternativeResponse]
    summary: dict[str, int]
