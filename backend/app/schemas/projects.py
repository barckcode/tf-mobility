from pydantic import BaseModel


class ProjectSource(BaseModel):
    label: str
    url: str


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    announced_date: str
    promised_date: str
    status: str
    responsible_entity: str
    sources: list[ProjectSource]
    related_contracts: list[str]
    last_update: str
    budget: float | None = None
    phase: str = ""
    progress: float = 0.0
    notes: str | None = None

    model_config = {"from_attributes": True}


class ProjectsSummary(BaseModel):
    on_track: int
    delayed: int
    stalled: int


class ProjectsListResponse(BaseModel):
    projects: list[ProjectResponse]
    summary: ProjectsSummary
