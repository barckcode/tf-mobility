from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.etl_run import EtlRun
from app.schemas.freshness import PipelineFreshness, FreshnessResponse

router = APIRouter(tags=["metadata"])

KNOWN_PIPELINES = [
    "turismo",
    "trafico_imd",
    "contratos",
    "estadisticas",
    "proyectos",
    "alternativas",
    "comparativa",
]


def _classify_freshness(days: int | None) -> str:
    """Classify freshness based on days since last successful update."""
    if days is None:
        return "unknown"
    if days < 45:
        return "fresh"
    if days <= 90:
        return "stale"
    return "outdated"


def _overall_freshness(pipeline_statuses: list[str]) -> str:
    """Determine overall freshness from individual pipeline statuses."""
    if not pipeline_statuses:
        return "unknown"
    if "outdated" in pipeline_statuses:
        return "outdated"
    if "stale" in pipeline_statuses:
        return "stale"
    if "unknown" in pipeline_statuses:
        return "stale"
    return "fresh"


@router.get("/metadata/freshness", response_model=FreshnessResponse)
def get_freshness(db: Session = Depends(get_db)):
    """Return data freshness information for all ETL pipelines."""
    now = datetime.utcnow()
    pipelines_result = []
    last_etl_run = None

    for pipeline_name in KNOWN_PIPELINES:
        # Get the latest run (any status) for this pipeline
        latest_run = (
            db.query(EtlRun)
            .filter(EtlRun.pipeline == pipeline_name)
            .order_by(EtlRun.started_at.desc())
            .first()
        )

        # Get the latest successful run for this pipeline
        latest_success = (
            db.query(EtlRun)
            .filter(EtlRun.pipeline == pipeline_name, EtlRun.status == "success")
            .order_by(EtlRun.started_at.desc())
            .first()
        )

        if latest_run is None:
            pipelines_result.append(PipelineFreshness(pipeline=pipeline_name))
            continue

        last_success_dt = latest_success.finished_at if latest_success else None
        last_run_dt = latest_run.finished_at or latest_run.started_at
        days_since = (now - last_success_dt).days if last_success_dt else None
        freshness = _classify_freshness(days_since)

        # Track the most recent ETL run overall
        if last_etl_run is None or last_run_dt > last_etl_run:
            last_etl_run = last_run_dt

        pipelines_result.append(
            PipelineFreshness(
                pipeline=pipeline_name,
                last_success=last_success_dt,
                last_run=last_run_dt,
                last_status=latest_run.status,
                records_processed=latest_success.records_processed if latest_success else 0,
                days_since_update=days_since,
                freshness=freshness,
            )
        )

    overall = _overall_freshness([p.freshness for p in pipelines_result])

    return FreshnessResponse(
        pipelines=pipelines_result,
        overall_freshness=overall,
        last_etl_run=last_etl_run,
    )
