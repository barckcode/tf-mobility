from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(300), unique=True)
    cif = Column(String(20))
    num_contratos = Column(Integer, default=0)
    importe_total = Column(Float, default=0.0)
