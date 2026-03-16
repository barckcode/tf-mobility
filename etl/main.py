"""Main ETL runner - executes all data pipelines.

Supports two modes:
- Default: Run all pipelines once and exit (for initial seed or manual runs).
- Scheduled (--scheduled): Run all pipelines, then repeat every 30 days.
"""

import argparse
import logging
import sys
import time
from datetime import datetime, timezone

from db import init_db, EtlRun, get_session

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger(__name__)

THIRTY_DAYS = 30 * 24 * 60 * 60  # seconds


def _record_etl_run(pipeline, status, records, started, error=None):
    """Record an ETL pipeline execution in the etl_runs table."""
    session = get_session()
    try:
        run = EtlRun(
            pipeline=pipeline,
            status=status,
            records_processed=records,
            started_at=started,
            finished_at=datetime.now(timezone.utc),
            error_message=error,
        )
        session.add(run)
        session.commit()
    except Exception as e:
        logger.error(f"Failed to record ETL run for {pipeline}: {e}")
        session.rollback()
    finally:
        session.close()


def run_all():
    """Run all ETL pipelines in sequence."""
    logger.info("=== Starting ETL pipelines ===")

    # Initialize database schema
    logger.info("Initializing database...")
    init_db()

    # Run individual pipelines
    from pipelines import (
        contratos,
        proyectos,
        estadisticas,
        turismo,
        alternativas,
        comparativa,
        trafico_imd,
    )

    pipelines = [
        ("turismo", turismo.run),
        ("trafico_imd", trafico_imd.run),
        ("contratos", contratos.run),
        ("estadisticas", estadisticas.run),
        ("proyectos", proyectos.run),
        ("alternativas", alternativas.run),
        ("comparativa", comparativa.run),
    ]

    results = {}
    for name, pipeline_fn in pipelines:
        started = datetime.now(timezone.utc)
        try:
            logger.info(f"--- Running pipeline: {name} ---")
            count = pipeline_fn()
            _record_etl_run(name, "success", count, started)
            results[name] = {"status": "success", "records": count}
            logger.info(f"Pipeline {name} completed: {count} records")
        except Exception as e:
            _record_etl_run(name, "error", 0, started, str(e))
            logger.error(f"Pipeline {name} failed: {e}", exc_info=True)
            results[name] = {"status": "error", "error": str(e)}

    # Summary
    logger.info("=== ETL Summary ===")
    for name, result in results.items():
        logger.info(f"  {name}: {result}")

    return results


def run_single(pipeline_name: str):
    """Run a single ETL pipeline by name."""
    logger.info(f"=== Running single pipeline: {pipeline_name} ===")
    init_db()

    from pipelines import (
        contratos,
        proyectos,
        estadisticas,
        turismo,
        alternativas,
        comparativa,
        trafico_imd,
    )

    pipeline_map = {
        "turismo": turismo.run,
        "trafico_imd": trafico_imd.run,
        "contratos": contratos.run,
        "estadisticas": estadisticas.run,
        "proyectos": proyectos.run,
        "alternativas": alternativas.run,
        "comparativa": comparativa.run,
    }

    if pipeline_name not in pipeline_map:
        logger.error(f"Unknown pipeline: {pipeline_name}. Available: {list(pipeline_map)}")
        sys.exit(1)

    started = datetime.now(timezone.utc)
    count = pipeline_map[pipeline_name]()
    _record_etl_run(pipeline_name, "success", count, started)
    logger.info(f"Pipeline {pipeline_name} completed: {count} records")


def main():
    """Entry point with CLI argument parsing."""
    parser = argparse.ArgumentParser(
        description="TF Mobility ETL - Fetch real data from public APIs"
    )
    parser.add_argument(
        "--scheduled",
        action="store_true",
        help="Run in scheduled mode (repeat every 30 days)",
    )
    parser.add_argument(
        "--only",
        type=str,
        default=None,
        help="Run only a specific pipeline (e.g. --only contratos)",
    )
    args = parser.parse_args()

    if args.only:
        run_single(args.only)
    else:
        run_all()

    if args.scheduled:
        logger.info("Scheduled mode: will re-run every 30 days")
        while True:
            time.sleep(THIRTY_DAYS)
            logger.info("=== Scheduled ETL run ===")
            try:
                run_all()
            except Exception as e:
                logger.error(f"Scheduled run failed: {e}", exc_info=True)
                # Don't crash — just log and wait for next cycle


if __name__ == "__main__":
    main()
