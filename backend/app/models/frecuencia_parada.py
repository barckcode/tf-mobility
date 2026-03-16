from sqlalchemy import Column, Integer, String
from app.database import Base


class FrecuenciaParada(Base):
    __tablename__ = "frecuencia_paradas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stop_id = Column(String(20), unique=True, nullable=False)
    buses_dia = Column(Integer, default=0)
    rutas_count = Column(Integer, default=0)
