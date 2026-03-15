from app.routers.stats import router as stats_router
from app.routers.contracts import router as contracts_router
from app.routers.projects import router as projects_router

__all__ = ["stats_router", "contracts_router", "projects_router"]
