from pydantic import BaseModel


class IslandComparison(BaseModel):
    id: int
    island: str
    community: str
    population: int
    area_km2: float
    annual_tourists: int
    tourist_resident_ratio: float
    registered_vehicles: int
    cars_per_km2: float
    road_investment_m_eur: float
    road_km: float
    has_train: str
    has_tram: str
    traffic_regulation: str
    source: str

    model_config = {"from_attributes": True}


class ComparisonResponse(BaseModel):
    islands: list[IslandComparison]
    canary_islands: list[IslandComparison]
    reference_islands: list[IslandComparison]
    highlights: dict[str, str]
