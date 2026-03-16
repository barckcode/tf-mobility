from sqlalchemy import Column, Integer, String, Float, Text
from app.database import Base


class ComparativaIsla(Base):
    __tablename__ = "comparativa_islas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    isla = Column(String(100), unique=True)
    comunidad = Column(String(100))
    poblacion = Column(Integer)
    superficie_km2 = Column(Float)
    turistas_anuales = Column(Integer)
    ratio_turistas_habitante = Column(Float)
    vehiculos_registrados = Column(Integer)
    coches_por_km2 = Column(Float)
    inversion_carreteras_m_eur = Column(Float)
    km_carreteras = Column(Float)
    tiene_tren = Column(String(10))
    tiene_tranvia = Column(String(10))
    regulacion_trafico = Column(String(200))
    fuente = Column(String(200))
