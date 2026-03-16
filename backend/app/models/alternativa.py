from sqlalchemy import Column, Integer, String, Text
from app.database import Base


class Alternativa(Base):
    __tablename__ = "alternativas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), unique=True)
    tipo = Column(String(50))
    estado = Column(String(50))
    operador = Column(String(200))
    cobertura = Column(Text)
    usuarios_anuales = Column(Integer)
    dato_clave = Column(Text)
    descripcion = Column(Text)
    color = Column(String(20))
    icono = Column(String(50))
    url_fuente = Column(Text)
