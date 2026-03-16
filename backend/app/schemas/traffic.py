from pydantic import BaseModel


class StationResponse(BaseModel):
    id: int
    year: int
    road: str
    section: str
    station_id: int
    station_name: str
    imd_total: int | None
    imd_ascending: float | None
    imd_descending: float | None
    imd_heavy: int | None
    avg_speed: float | None

    model_config = {"from_attributes": True}


class TrafficResponse(BaseModel):
    stations: list[StationResponse]
    total: int
    year: int
    roads_summary: list[dict]  # [{road: "TF-5", max_imd: 117791, stations: 14}]


class TrafficYearsResponse(BaseModel):
    available_years: list[int]
