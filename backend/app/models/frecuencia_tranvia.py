from app.database import Base
from sqlalchemy import Column, Integer, String


class FrecuenciaTranvia(Base):
    __tablename__ = "frecuencia_tranvia"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stop_id = Column(String(20), unique=True, nullable=False)
    trams_dia = Column(Integer, default=0)
    rutas_count = Column(Integer, default=0)
