from app.database import Base
from sqlalchemy import Column, Integer, String


class RutaTranvia(Base):
    __tablename__ = "rutas_tranvia"

    id = Column(Integer, primary_key=True, autoincrement=True)
    route_id = Column(String(20), unique=True, nullable=False)
    short_name = Column(String(50))
    long_name = Column(String(300))
    color = Column(String(10))
