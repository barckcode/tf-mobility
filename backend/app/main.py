from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    stats_router,
    contracts_router,
    projects_router,
    tourism_router,
    alternatives_router,
    comparison_router,
)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(stats_router, prefix=settings.api_v1_prefix)
app.include_router(contracts_router, prefix=settings.api_v1_prefix)
app.include_router(projects_router, prefix=settings.api_v1_prefix)
app.include_router(tourism_router, prefix=settings.api_v1_prefix)
app.include_router(alternatives_router, prefix=settings.api_v1_prefix)
app.include_router(comparison_router, prefix=settings.api_v1_prefix)


@app.get(f"{settings.api_v1_prefix}/health")
def health_check():
    return {"status": "ok", "service": settings.app_name}
