from pydantic import BaseModel


class MonthlyTourism(BaseModel):
    year: int
    month: int
    tourists: int
    island: str
    source: str

    model_config = {"from_attributes": True}


class TourismListResponse(BaseModel):
    data: list[MonthlyTourism]
    total_records: int


class IslandRegulation(BaseModel):
    island: str
    has_regulation: bool
    description: str
    source: str


class TourismStatsResponse(BaseModel):
    annual_tourists_2024: int
    annual_tourists_2023: int
    rental_cars_canarias: int
    rental_cars_tenerife: int
    avg_daily_spend_eur: float
    avg_stay_days: float
    monthly_data: list[MonthlyTourism]
    regulations: list[IslandRegulation]
    sources: dict[str, str]
