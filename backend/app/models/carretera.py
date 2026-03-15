from sqlalchemy import Column, Integer, String, Float, Text
from app.database import Base


class Carretera(Base):
    __tablename__ = "carreteras"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(20), unique=True)
    nombre = Column(String(300))
    tipo = Column(String(50))
    longitud_km = Column(Float)
    imd = Column(Integer)
    notas = Column(Text)
