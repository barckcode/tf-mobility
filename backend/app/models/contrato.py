from sqlalchemy import Column, Integer, String, Float, Text, Date
from app.database import Base


class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    expediente = Column(String(100), unique=True)
    objeto = Column(Text)
    tipo = Column(String(50))
    organo_contratacion = Column(String(200))
    importe_licitacion = Column(Float)
    importe_adjudicacion = Column(Float)
    adjudicatario = Column(String(300))
    cif_adjudicatario = Column(String(20))  # NIF/CIF of the winning company
    num_ofertas = Column(Integer)  # Number of bids received
    fecha_publicacion = Column(Date)
    fecha_adjudicacion = Column(Date)
    plazo = Column(String(100))
    estado = Column(String(50))
    carretera = Column(String(20))
    url_fuente = Column(Text)
