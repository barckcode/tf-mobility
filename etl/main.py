"""Main ETL runner - executes all data pipelines."""

import logging
import sys

from db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger(__name__)


def run_all():
    """Run all ETL pipelines in sequence."""
    logger.info("=== Starting ETL pipelines ===")

    # Initialize database schema
    logger.info("Initializing database...")
    init_db()

    # Run individual pipelines
    from pipelines import contratos, proyectos, estadisticas, turismo

    pipelines = [
        ("contratos", contratos.run),
        ("proyectos", proyectos.run),
        ("estadisticas", estadisticas.run),
        ("turismo", turismo.run),
    ]

    results = {}
    for name, pipeline_fn in pipelines:
        try:
            logger.info(f"--- Running pipeline: {name} ---")
            count = pipeline_fn()
            results[name] = {"status": "success", "records": count}
            logger.info(f"Pipeline {name} completed: {count} records")
        except Exception as e:
            logger.error(f"Pipeline {name} failed: {e}", exc_info=True)
            results[name] = {"status": "error", "error": str(e)}

    # Summary
    logger.info("=== ETL Summary ===")
    for name, result in results.items():
        logger.info(f"  {name}: {result}")

    return results


if __name__ == "__main__":
    run_all()
