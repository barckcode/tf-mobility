"""Pipeline: Seed key statistics from official public sources.

Data sourced from:
- DGT (Dirección General de Tráfico): Vehicle fleet data
- INE (Instituto Nacional de Estadística): Population data
- ISTAC (Instituto Canario de Estadística): Regional statistics
"""

import logging
from datetime import date

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_session, EstadisticaClave

logger = logging.getLogger(__name__)

# Official statistics from public sources
# Sources:
# - DGT Anuario Estadístico 2023: https://www.dgt.es/menusecundario/dgt-en-cifras/
# - INE Padrón Municipal 2023: https://www.ine.es/
# - ISTAC: https://www.gobiernodecanarias.org/istac/
STATS = [
    {
        "clave": "turismos_registrados",
        "valor": "531427",
        "unidad": "vehículos",
        "fuente": "DGT - Anuario Estadístico 2023",
        "fecha_dato": date(2023, 12, 31),
    },
    {
        "clave": "vehiculos_totales",
        "valor": "698234",
        "unidad": "vehículos",
        "fuente": "DGT - Anuario Estadístico 2023",
        "fecha_dato": date(2023, 12, 31),
    },
    {
        "clave": "poblacion",
        "valor": "1007641",
        "unidad": "habitantes",
        "fuente": "INE - Padrón Municipal 2023",
        "fecha_dato": date(2023, 1, 1),
    },
    {
        "clave": "superficie_km2",
        "valor": "2034.38",
        "unidad": "km²",
        "fuente": "Instituto Geográfico Nacional",
        "fecha_dato": date(2023, 1, 1),
    },
    {
        "clave": "coches_por_km2",
        "valor": "261.2",
        "unidad": "vehículos/km²",
        "fuente": "Cálculo propio (turismos / superficie)",
        "fecha_dato": date(2023, 12, 31),
    },
    {
        "clave": "indice_motorizacion",
        "valor": "527",
        "unidad": "turismos por 1.000 hab.",
        "fuente": "Cálculo propio (turismos / población * 1000)",
        "fecha_dato": date(2023, 12, 31),
    },
    {
        "clave": "anio_datos",
        "valor": "2023",
        "unidad": "año",
        "fuente": "DGT / INE",
        "fecha_dato": date(2023, 12, 31),
    },
    {
        "clave": "turistas_anuales",
        "valor": "6210000",
        "unidad": "turistas/año",
        "fuente": "ISTAC - Estadística de Movimientos Turísticos 2023",
        "fecha_dato": date(2023, 12, 31),
    },
    {
        "clave": "vehiculos_alquiler",
        "valor": "48500",
        "unidad": "vehículos",
        "fuente": "ISTAC - Estimación flotas rent-a-car 2023",
        "fecha_dato": date(2023, 12, 31),
    },
    {
        "clave": "imd_tf5_sc_laguna",
        "valor": "125000",
        "unidad": "vehículos/día",
        "fuente": "Cabildo de Tenerife - Mapa de tráfico 2023",
        "fecha_dato": date(2023, 12, 31),
    },
    {
        "clave": "imd_tf1_sc_sur",
        "valor": "95000",
        "unidad": "vehículos/día",
        "fuente": "Cabildo de Tenerife - Mapa de tráfico 2023",
        "fecha_dato": date(2023, 12, 31),
    },
]


def run():
    """Seed key statistics into the database."""
    session = get_session()
    count = 0

    try:
        for stat_data in STATS:
            existing = session.query(EstadisticaClave).filter_by(
                clave=stat_data["clave"]
            ).first()

            if existing:
                for key, value in stat_data.items():
                    setattr(existing, key, value)
                logger.info(f"Updated stat: {stat_data['clave']} = {stat_data['valor']}")
            else:
                stat = EstadisticaClave(**stat_data)
                session.add(stat)
                logger.info(f"Added stat: {stat_data['clave']} = {stat_data['valor']}")

            count += 1

        session.commit()
        logger.info(f"Estadísticas pipeline completed: {count} stats upserted")
    except Exception as e:
        session.rollback()
        logger.error(f"Error in estadísticas pipeline: {e}")
        raise
    finally:
        session.close()

    return count
