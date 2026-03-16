"""Pipeline: Seed inter-island comparison data for Canary Islands.

Data sourced from:
- ISTAC (Instituto Canario de Estadística)
- DGT (Dirección General de Tráfico)
- INE (Instituto Nacional de Estadística)
- FRONTUR / Turismo de Canarias
"""

import logging

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_session, ComparativaIsla, init_db

logger = logging.getLogger(__name__)

# Comparative data for Canary Islands (and reference islands)
# Sources: ISTAC, DGT Anuario 2023, INE Padrón 2023, FRONTUR 2024
ISLANDS = [
    {
        "isla": "Tenerife",
        "comunidad": "Canarias",
        "poblacion": 1007641,
        "superficie_km2": 2034.38,
        "turistas_anuales": 7280000,
        "ratio_turistas_habitante": 7.2,
        "vehiculos_registrados": 698234,
        "coches_por_km2": 261.2,
        "inversion_carreteras_m_eur": 350.0,
        "km_carreteras": 1850.0,
        "tiene_tren": "en_proyecto",
        "tiene_tranvia": "si",
        "regulacion_trafico": "No specific vehicle regulation for tourists",
        "fuente": "ISTAC / DGT / INE 2023-2024",
    },
    {
        "isla": "Gran Canaria",
        "comunidad": "Canarias",
        "poblacion": 855521,
        "superficie_km2": 1560.10,
        "turistas_anuales": 4500000,
        "ratio_turistas_habitante": 5.3,
        "vehiculos_registrados": 580000,
        "coches_por_km2": 250.0,
        "inversion_carreteras_m_eur": 280.0,
        "km_carreteras": 1400.0,
        "tiene_tren": "no",
        "tiene_tranvia": "no",
        "regulacion_trafico": "No specific vehicle regulation for tourists",
        "fuente": "ISTAC / DGT / INE 2023-2024",
    },
    {
        "isla": "Lanzarote",
        "comunidad": "Canarias",
        "poblacion": 157815,
        "superficie_km2": 845.94,
        "turistas_anuales": 3200000,
        "ratio_turistas_habitante": 20.3,
        "vehiculos_registrados": 115000,
        "coches_por_km2": 135.9,
        "inversion_carreteras_m_eur": 45.0,
        "km_carreteras": 580.0,
        "tiene_tren": "no",
        "tiene_tranvia": "no",
        "regulacion_trafico": "UNESCO Biosphere Reserve traffic discussions ongoing",
        "fuente": "ISTAC / DGT / INE 2023-2024",
    },
    {
        "isla": "Fuerteventura",
        "comunidad": "Canarias",
        "poblacion": 119732,
        "superficie_km2": 1659.74,
        "turistas_anuales": 2800000,
        "ratio_turistas_habitante": 23.4,
        "vehiculos_registrados": 85000,
        "coches_por_km2": 51.2,
        "inversion_carreteras_m_eur": 35.0,
        "km_carreteras": 650.0,
        "tiene_tren": "no",
        "tiene_tranvia": "no",
        "regulacion_trafico": "No specific regulation, highest tourist-to-resident ratio",
        "fuente": "ISTAC / DGT / INE 2023-2024",
    },
    {
        "isla": "La Palma",
        "comunidad": "Canarias",
        "poblacion": 83458,
        "superficie_km2": 708.32,
        "turistas_anuales": 400000,
        "ratio_turistas_habitante": 4.8,
        "vehiculos_registrados": 62000,
        "coches_por_km2": 87.5,
        "inversion_carreteras_m_eur": 25.0,
        "km_carreteras": 480.0,
        "tiene_tren": "no",
        "tiene_tranvia": "no",
        "regulacion_trafico": "Post-volcano reconstruction priority, limited tourism traffic pressure",
        "fuente": "ISTAC / DGT / INE 2023-2024",
    },
    {
        "isla": "Formentera",
        "comunidad": "Illes Balears",
        "poblacion": 12216,
        "superficie_km2": 83.24,
        "turistas_anuales": 800000,
        "ratio_turistas_habitante": 65.5,
        "vehiculos_registrados": 8500,
        "coches_por_km2": 102.1,
        "inversion_carreteras_m_eur": 5.0,
        "km_carreteras": 60.0,
        "tiene_tren": "no",
        "tiene_tranvia": "no",
        "regulacion_trafico": "Vehicle entry limits in summer since 2019 (max 12,500 vehicles/day)",
        "fuente": "INE / Consell Insular de Formentera 2023",
    },
    {
        "isla": "Mallorca",
        "comunidad": "Illes Balears",
        "poblacion": 923608,
        "superficie_km2": 3640.11,
        "turistas_anuales": 13800000,
        "ratio_turistas_habitante": 14.9,
        "vehiculos_registrados": 720000,
        "coches_por_km2": 197.8,
        "inversion_carreteras_m_eur": 200.0,
        "km_carreteras": 2100.0,
        "tiene_tren": "si",
        "tiene_tranvia": "no",
        "regulacion_trafico": "Rent-a-car fleet cap since 2024 (Ley Balear de Movilidad)",
        "fuente": "INE / Govern Illes Balears 2023-2024",
    },
    {
        "isla": "Ibiza",
        "comunidad": "Illes Balears",
        "poblacion": 152710,
        "superficie_km2": 571.76,
        "turistas_anuales": 4000000,
        "ratio_turistas_habitante": 26.2,
        "vehiculos_registrados": 105000,
        "coches_por_km2": 183.6,
        "inversion_carreteras_m_eur": 30.0,
        "km_carreteras": 280.0,
        "tiene_tren": "no",
        "tiene_tranvia": "no",
        "regulacion_trafico": "Non-resident vehicle circulation tax proposed",
        "fuente": "INE / Consell Insular d'Eivissa 2023-2024",
    },
]


def run():
    """Seed island comparison data into the database."""
    init_db()
    session = get_session()
    count = 0

    try:
        for island_data in ISLANDS:
            existing = session.query(ComparativaIsla).filter_by(
                isla=island_data["isla"]
            ).first()

            if existing:
                for key, value in island_data.items():
                    setattr(existing, key, value)
                logger.info(f"Updated island: {island_data['isla']}")
            else:
                session.add(ComparativaIsla(**island_data))
                logger.info(f"Added island: {island_data['isla']}")

            count += 1

        session.commit()
        logger.info(f"Comparativa pipeline completed: {count} islands upserted")
    except Exception as e:
        session.rollback()
        logger.error(f"Error in comparativa pipeline: {e}")
        raise
    finally:
        session.close()

    return count
