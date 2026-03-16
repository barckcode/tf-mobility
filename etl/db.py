"""Shared database utilities for ETL pipelines."""

import os
import logging
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, Date, DateTime, UniqueConstraint
from sqlalchemy.orm import sessionmaker, DeclarativeBase

logger = logging.getLogger(__name__)

DATABASE_PATH = os.getenv("DATABASE_PATH", os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "backend", "data", "tfmobility.db"
))

DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    expediente = Column(String(100), unique=True)
    objeto = Column(Text)
    tipo = Column(String(50))  # obras, servicios, suministros
    organo_contratacion = Column(String(200))
    importe_licitacion = Column(Float)
    importe_adjudicacion = Column(Float)
    adjudicatario = Column(String(300))
    fecha_publicacion = Column(Date)
    fecha_adjudicacion = Column(Date)
    plazo = Column(String(100))
    estado = Column(String(50))  # publicado, adjudicado, en_ejecucion, finalizado
    carretera = Column(String(20))  # TF-XXX code
    url_fuente = Column(Text)


class Proyecto(Base):
    __tablename__ = "proyectos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(300), unique=True)
    descripcion = Column(Text)
    estado = Column(String(20))  # verde, amarillo, rojo
    fase = Column(String(100))  # planificacion, licitacion, ejecucion, finalizado
    presupuesto = Column(Float)
    fecha_inicio = Column(Date)
    fecha_fin_prevista = Column(Date)
    porcentaje_avance = Column(Float)
    responsable = Column(String(200))
    url_fuente = Column(Text)
    notas = Column(Text)


class EstadisticaClave(Base):
    __tablename__ = "estadisticas_clave"

    id = Column(Integer, primary_key=True, autoincrement=True)
    clave = Column(String(100), unique=True)
    valor = Column(String(200))
    unidad = Column(String(50))
    fuente = Column(String(200))
    fecha_dato = Column(Date)


class TurismoMensual(Base):
    __tablename__ = "turismo_mensual"

    id = Column(Integer, primary_key=True, autoincrement=True)
    anio = Column(Integer)
    mes = Column(Integer)
    turistas = Column(Integer)
    isla = Column(String(50))
    fuente = Column(String(200))


class Carretera(Base):
    __tablename__ = "carreteras"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(20), unique=True)  # TF-1, TF-5, etc.
    nombre = Column(String(300))
    tipo = Column(String(50))  # autopista, autovia, carretera
    longitud_km = Column(Float)
    imd = Column(Integer)  # Intensidad Media Diaria
    notas = Column(Text)


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(300), unique=True)
    cif = Column(String(20))
    num_contratos = Column(Integer, default=0)
    importe_total = Column(Float, default=0.0)


class EstacionAforo(Base):
    """Traffic counting station data from datos.tenerife.es IMD datasets."""
    __tablename__ = "estaciones_aforo"

    id = Column(Integer, primary_key=True, autoincrement=True)
    anio = Column(Integer, nullable=False)
    carretera = Column(String(20))  # TF-1, TF-5, etc.
    tramo = Column(String(200))
    estacion_id = Column(Integer, nullable=False)
    estacion_nombre = Column(String(200))
    imd_total = Column(Integer)
    imd_ascendentes = Column(Float)
    imd_descendentes = Column(Float)
    imd_pesados = Column(Integer)
    velocidad_media = Column(Float)

    __table_args__ = (
        UniqueConstraint("anio", "estacion_id", name="uq_estacion_anio"),
    )


class Alternativa(Base):
    __tablename__ = "alternativas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), unique=True)
    tipo = Column(String(50))  # publico, futuro, activo, privado
    estado = Column(String(50))  # operativo, en_estudio, fragmentado, reciente
    operador = Column(String(200))
    cobertura = Column(Text)
    usuarios_anuales = Column(Integer)
    dato_clave = Column(Text)
    descripcion = Column(Text)
    color = Column(String(20))
    icono = Column(String(50))
    url_fuente = Column(Text)


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
    tiene_tren = Column(String(10))  # si, no, en_proyecto
    tiene_tranvia = Column(String(10))
    regulacion_trafico = Column(String(200))
    fuente = Column(String(200))


class ParadaGuagua(Base):
    """Bus stop from TITSA GTFS data."""
    __tablename__ = "paradas_guagua"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stop_id = Column(String(20), unique=True, nullable=False)
    name = Column(String(300))
    lat = Column(Float)
    lon = Column(Float)


class RutaGuagua(Base):
    """Bus route from TITSA GTFS data."""
    __tablename__ = "rutas_guagua"

    id = Column(Integer, primary_key=True, autoincrement=True)
    route_id = Column(String(20), unique=True, nullable=False)
    short_name = Column(String(50))
    long_name = Column(String(300))
    color = Column(String(10))


class FrecuenciaParada(Base):
    """Pre-computed bus frequency per stop on a typical weekday."""
    __tablename__ = "frecuencia_paradas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stop_id = Column(String(20), unique=True, nullable=False)
    buses_dia = Column(Integer, default=0)
    rutas_count = Column(Integer, default=0)


class RutaTramo(Base):
    """Pre-computed route-to-road corridor overlap."""
    __tablename__ = "rutas_tramo"

    id = Column(Integer, primary_key=True, autoincrement=True)
    route_id = Column(String(20), nullable=False)
    carretera = Column(String(20), nullable=False)
    overlap_description = Column(Text)

    __table_args__ = (
        UniqueConstraint("route_id", "carretera", name="uq_ruta_tramo_carretera"),
    )


class EtlRun(Base):
    """Tracks ETL pipeline execution history for data freshness monitoring."""
    __tablename__ = "etl_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pipeline = Column(String(100), nullable=False)  # turismo, contratos, estadisticas, etc.
    status = Column(String(20), nullable=False)  # success, error
    records_processed = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=False)
    finished_at = Column(DateTime)
    error_message = Column(Text)


def init_db():
    """Create all tables in the database."""
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    Base.metadata.create_all(engine)
    logger.info(f"Database initialized at {DATABASE_PATH}")


def get_session():
    """Get a new database session."""
    return SessionLocal()
