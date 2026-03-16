from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base


class EtlRun(Base):
    """Tracks ETL pipeline execution history for data freshness monitoring."""
    __tablename__ = "etl_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pipeline = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False)
    records_processed = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=False)
    finished_at = Column(DateTime)
    error_message = Column(Text)
