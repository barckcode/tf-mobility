from app.routers.stats import router as stats_router
from app.routers.contracts import router as contracts_router
from app.routers.projects import router as projects_router
from app.routers.tourism import router as tourism_router
from app.routers.alternatives import router as alternatives_router
from app.routers.comparison import router as comparison_router
from app.routers.freshness import router as freshness_router

__all__ = [
    "stats_router",
    "contracts_router",
    "projects_router",
    "tourism_router",
    "alternatives_router",
    "comparison_router",
    "freshness_router",
]
