from app.database import Base
from sqlalchemy import Column, Integer, String, Float


class ParadaTranvia(Base):
    __tablename__ = "paradas_tranvia"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stop_id = Column(String(20), unique=True, nullable=False)
    name = Column(String(300))
    lat = Column(Float)
    lon = Column(Float)
