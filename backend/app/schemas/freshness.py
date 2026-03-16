from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PipelineFreshness(BaseModel):
    pipeline: str
    last_success: Optional[datetime] = None
    last_run: Optional[datetime] = None
    last_status: str = "never_run"
    records_processed: int = 0
    days_since_update: Optional[int] = None
    freshness: str = "unknown"  # "fresh" (<45 days), "stale" (45-90), "outdated" (>90), "unknown"


class FreshnessResponse(BaseModel):
    pipelines: list[PipelineFreshness]
    overall_freshness: str  # "fresh", "stale", "outdated"
    last_etl_run: Optional[datetime] = None
