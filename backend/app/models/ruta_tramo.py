from sqlalchemy import Column, Integer, String, Text
from app.database import Base


class RutaTramo(Base):
    __tablename__ = "rutas_tramo"

    id = Column(Integer, primary_key=True, autoincrement=True)
    route_id = Column(String(20), nullable=False)
    carretera = Column(String(20), nullable=False)
    overlap_description = Column(Text)
