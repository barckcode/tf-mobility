from pydantic import BaseModel


class StatsResponse(BaseModel):
    registered_cars: int
    total_vehicles: int
    cars_per_km2: float
    population: int
    motorization_index: int
    island_area_km2: float
    data_year: int
    sources: dict[str, str]
