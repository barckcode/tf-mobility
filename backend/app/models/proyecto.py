from sqlalchemy import Column, Integer, String, Float, Text, Date
from app.database import Base


class Proyecto(Base):
    __tablename__ = "proyectos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(300), unique=True)
    descripcion = Column(Text)
    estado = Column(String(20))
    fase = Column(String(100))
    presupuesto = Column(Float)
    fecha_inicio = Column(Date)
    fecha_fin_prevista = Column(Date)
    porcentaje_avance = Column(Float)
    responsable = Column(String(200))
    url_fuente = Column(Text)
    notas = Column(Text)
