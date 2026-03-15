import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./data/tfmobility.db"
    )
    app_name: str = "TF Mobility API"
    api_v1_prefix: str = "/api/v1"
    debug: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
