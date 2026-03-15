from sqlalchemy import Column, Integer, String
from app.database import Base


class TurismoMensual(Base):
    __tablename__ = "turismo_mensual"

    id = Column(Integer, primary_key=True, autoincrement=True)
    anio = Column(Integer)
    mes = Column(Integer)
    turistas = Column(Integer)
    isla = Column(String(50))
    fuente = Column(String(200))
