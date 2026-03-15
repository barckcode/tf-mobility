from sqlalchemy import Column, Integer, String, Date
from app.database import Base


class EstadisticaClave(Base):
    __tablename__ = "estadisticas_clave"

    id = Column(Integer, primary_key=True, autoincrement=True)
    clave = Column(String(100), unique=True)
    valor = Column(String(200))
    unidad = Column(String(50))
    fuente = Column(String(200))
    fecha_dato = Column(Date)
