from sqlalchemy import Column, Integer, String
from app.database import Base


class RutaGuagua(Base):
    __tablename__ = "rutas_guagua"

    id = Column(Integer, primary_key=True, autoincrement=True)
    route_id = Column(String(20), unique=True, nullable=False)
    short_name = Column(String(50))
    long_name = Column(String(300))
    color = Column(String(10))
