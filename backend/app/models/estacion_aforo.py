from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class EstacionAforo(Base):
    __tablename__ = "estaciones_aforo"

    id = Column(Integer, primary_key=True)
    anio = Column(Integer)
    carretera = Column(String(20))
    tramo = Column(String(200))
    estacion_id = Column(Integer)
    estacion_nombre = Column(String(200))
    imd_total = Column(Integer)
    imd_ascendentes = Column(Float)
    imd_descendentes = Column(Float)
    imd_pesados = Column(Integer)
    velocidad_media = Column(Float)
