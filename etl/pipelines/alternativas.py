"""Pipeline: Seed transport alternatives data for Tenerife.

Data sourced from:
- Metrotenerife S.A. (official website and annual reports)
- TITSA (Transportes Interurbanos de Tenerife S.A.)
- Plan de Movilidad Sostenible de Tenerife 2024-2035
- Cabildo de Tenerife official announcements
- Press reports for VTC/Uber presence

Every single entry references a verifiable public source.
"""

import logging
from datetime import date

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_session, Alternativa, EstadisticaClave, init_db

logger = logging.getLogger(__name__)

ALTERNATIVES = [
    {
        "nombre": "Tranvia de Tenerife (Metrotenerife)",
        "tipo": "publico",
        "estado": "operativo",
        "operador": "Metrotenerife S.A.",
        "cobertura": "Area metropolitana Santa Cruz - La Laguna",
        "usuarios_anuales": 16000000,
        "dato_clave": (
            "~16M passengers/year. Linea 1: Santa Cruz - La Laguna (12.5 km, 21 stops). "
            "Linea 2: La Cuesta - Tincer (3.6 km, 6 stops). Only rail-based "
            "public transport in the Canary Islands."
        ),
        "descripcion": (
            "Light rail system connecting Santa Cruz de Tenerife and San Cristobal "
            "de La Laguna. Line 1 opened in 2007, Line 2 in 2009. Operates daily "
            "approximately 6:00-0:00. Frequency: 5-10 min at peak, 15 min off-peak. "
            "The only tram system in the Canary Islands. Managed by "
            "Metrotenerife S.A., a public company of the Cabildo de Tenerife."
        ),
        "color": "#16C79A",
        "icono": "tram",
        "url_fuente": "https://www.metrotenerife.com",
    },
    {
        "nombre": "Guaguas TITSA",
        "tipo": "publico",
        "estado": "operativo",
        "operador": "Transportes Interurbanos de Tenerife S.A. (TITSA)",
        "cobertura": "Red insular completa",
        "usuarios_anuales": 50000000,
        "dato_clave": (
            "~50M passengers/year. 100+ lines covering the entire island. "
            "Free rides program active via Gobierno de Canarias subsidy. "
            "Integrated ticketing with TenMas card."
        ),
        "descripcion": (
            "Comprehensive intercity and urban bus network operated by TITSA, "
            "the largest public transport operator in Tenerife. Over 100 lines "
            "covering all municipalities. Main hubs: Santa Cruz, La Laguna, "
            "Puerto de la Cruz, Los Cristianos, Costa Adeje. Heavily subsidized "
            "fares since 2022 (Gobierno de Canarias free transport subsidy). "
            "Uses TenMas integrated ticketing card."
        ),
        "color": "#16C79A",
        "icono": "bus",
        "url_fuente": "https://titsa.com",
    },
    {
        "nombre": "Transporte a Demanda (zonas de medianias)",
        "tipo": "publico",
        "estado": "operativo",
        "operador": "Cabildo de Tenerife",
        "cobertura": "Zonas de medianias (rural)",
        "usuarios_anuales": 13000,
        "dato_clave": (
            "13,000+ users. Demand-responsive transport for rural highland areas "
            "poorly served by conventional bus routes. Active in 4+ zones."
        ),
        "descripcion": (
            "Demand-responsive transport service for rural and highland areas "
            "(medianias) poorly served by conventional bus routes. Users book "
            "trips via app or phone. Launched 2021, expanded to 4+ zones by 2024. "
            "Serves areas including Anaga, Teno, and rural hill zones. "
            "Key service for elderly and mobility-reduced populations."
        ),
        "color": "#16C79A",
        "icono": "demand",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/site_content/541-movilidad",
    },
    {
        "nombre": "Tren del Sur (futuro)",
        "tipo": "futuro",
        "estado": "en_estudio",
        "operador": "Cabildo de Tenerife / Gobierno de Canarias",
        "cobertura": "Santa Cruz - Costa Adeje (proyecto)",
        "usuarios_anuales": 0,
        "dato_clave": (
            "Estimated first section: Santa Cruz - Adeje, ~80 km. "
            "Budget: ~3,600M EUR (Plan de Movilidad estimate). "
            "Currently in 'estudio informativo' phase. No construction date set."
        ),
        "descripcion": (
            "Major rail project connecting Santa Cruz with the tourist south coast. "
            "Included in the Plan de Movilidad Sostenible de Tenerife 2024-2035. "
            "First announced decades ago, currently in preliminary study phase. "
            "No physical construction has ever begun. Funding dependent on "
            "national and EU budgets."
        ),
        "color": "#F5A623",
        "icono": "train",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/site_content/541-movilidad",
    },
    {
        "nombre": "Tren del Norte (futuro)",
        "tipo": "futuro",
        "estado": "en_estudio",
        "operador": "Cabildo de Tenerife / Gobierno de Canarias",
        "cobertura": "Santa Cruz - Los Realejos (proyecto)",
        "usuarios_anuales": 0,
        "dato_clave": (
            "Estimated: Santa Cruz - Los Realejos, ~50 km. "
            "Budget: ~2,100M EUR. Ideas competition (concurso de ideas) "
            "launched in 2025. Less advanced than Tren del Sur."
        ),
        "descripcion": (
            "Rail project connecting Santa Cruz with the north coast via "
            "La Laguna, Tacoronte, and the Orotava Valley. Included in the "
            "Plan de Movilidad Sostenible de Tenerife 2024-2035. "
            "Ideas competition launched in 2025. Conceptual phase."
        ),
        "color": "#F5A623",
        "icono": "train",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/site_content/541-movilidad",
    },
    {
        "nombre": "Red de carriles bici",
        "tipo": "activo",
        "estado": "fragmentado",
        "operador": "Ayuntamientos / Cabildo de Tenerife",
        "cobertura": "Fragmentada, sin red continua",
        "usuarios_anuales": 0,
        "dato_clave": (
            "No continuous island-wide cycle network. Fragmented segments in "
            "some municipalities (Santa Cruz, La Laguna, Adeje, Arona). "
            "Terrain and climate are significant barriers."
        ),
        "descripcion": (
            "Cycling infrastructure in Tenerife is fragmented and insufficient. "
            "Some municipalities have built short segments, but there is no "
            "continuous network connecting major population centers. Steep terrain "
            "and heat in the south are additional barriers. E-bike rentals "
            "are growing in tourist areas but remain niche."
        ),
        "color": "#E94560",
        "icono": "bike",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/site_content/541-movilidad",
    },
    {
        "nombre": "VTC / Uber",
        "tipo": "privado",
        "estado": "reciente",
        "operador": "Uber / Various VTC operators",
        "cobertura": "Zona turistica sur + area metropolitana",
        "usuarios_anuales": 0,
        "dato_clave": (
            "Uber arrived in Tenerife recently. Growing presence in tourist areas "
            "of the south coast and the metropolitan area. Supplements taxi service."
        ),
        "descripcion": (
            "Ride-hailing services (VTC - Vehiculo de Turismo con Conductor) "
            "have recently become available in Tenerife. Growing presence "
            "especially in the tourist zones of the south coast (Los Cristianos, "
            "Costa Adeje, Las Americas) and the Santa Cruz - La Laguna "
            "metropolitan area. Regulatory framework still evolving."
        ),
        "color": "#6C757D",
        "icono": "vtc",
        "url_fuente": "https://www.uber.com/es/es/ride/",
    },
]

# Tourism-related KPIs from official sources
TOURISM_KPIS = [
    {
        "clave": "vehiculos_alquiler_canarias",
        "valor": "100000",
        "unidad": "vehiculos",
        "fuente": "ISTAC - Estimacion flotas rent-a-car Canarias 2024",
        "fecha_dato": date(2024, 12, 31),
    },
    {
        "clave": "gasto_diario_turista",
        "valor": "190",
        "unidad": "EUR/dia",
        "fuente": "ISTAC - Encuesta de Gasto Turistico 2024",
        "fecha_dato": date(2024, 12, 31),
    },
    {
        "clave": "estancia_media_turista",
        "valor": "7.6",
        "unidad": "dias",
        "fuente": "ISTAC - Encuesta de Alojamiento Turistico 2024",
        "fecha_dato": date(2024, 12, 31),
    },
    {
        "clave": "turistas_anuales_2024",
        "valor": "7280000",
        "unidad": "turistas/anio",
        "fuente": "ISTAC - FRONTUR Canarias 2024",
        "fecha_dato": date(2024, 12, 31),
    },
    {
        "clave": "regulacion_formentera",
        "valor": "Si - Limita entrada de vehiculos en verano + tasa (since 2019)",
        "unidad": "regulacion",
        "fuente": "Consell Insular de Formentera - Regulacion estival vehiculos",
        "fecha_dato": date(2024, 1, 1),
    },
    {
        "clave": "regulacion_ibiza",
        "valor": "Si - Cupo de 20,168 vehiculos foraneos/dia en temporada alta (since 2025)",
        "unidad": "regulacion",
        "fuente": "Consell Insular d'Eivissa - Acord regulacio vehicles 2025",
        "fecha_dato": date(2025, 1, 1),
    },
    {
        "clave": "regulacion_mallorca",
        "valor": "En preparacion - Legislacion en tramite tras 400K coches externos en 2023",
        "unidad": "regulacion",
        "fuente": "Govern de les Illes Balears - Ley de Movilidad Sostenible (en tramite)",
        "fecha_dato": date(2024, 1, 1),
    },
    {
        "clave": "regulacion_azores",
        "valor": "Si - Acceso restringido a zonas turisticas con lanzaderas",
        "unidad": "regulacion",
        "fuente": "Governo Regional dos Acores - Regulamento mobilidade turistica",
        "fecha_dato": date(2024, 1, 1),
    },
    {
        "clave": "regulacion_madeira",
        "valor": "En debate - Flota crecio 60% en 3 anios, regulacion en discusion",
        "unidad": "regulacion",
        "fuente": "Governo Regional da Madeira - Debate parlamentario mobilidade",
        "fecha_dato": date(2024, 1, 1),
    },
    {
        "clave": "regulacion_canarias",
        "valor": "No - Sin regulacion especifica de vehiculos turisticos",
        "unidad": "regulacion",
        "fuente": "Gobierno de Canarias",
        "fecha_dato": date(2024, 1, 1),
    },
]


def run():
    """Seed transport alternatives and tourism KPIs."""
    init_db()
    session = get_session()
    count = 0

    try:
        # Seed alternatives
        for alt_data in ALTERNATIVES:
            existing = session.query(Alternativa).filter_by(nombre=alt_data["nombre"]).first()
            if existing:
                for key, value in alt_data.items():
                    setattr(existing, key, value)
                logger.info(f"Updated alternative: {alt_data['nombre']}")
            else:
                session.add(Alternativa(**alt_data))
                logger.info(f"Added alternative: {alt_data['nombre']}")
            count += 1

        # Seed tourism KPIs
        for kpi in TOURISM_KPIS:
            existing = session.query(EstadisticaClave).filter_by(clave=kpi["clave"]).first()
            if existing:
                for key, value in kpi.items():
                    setattr(existing, key, value)
                logger.info(f"Updated KPI: {kpi['clave']}")
            else:
                session.add(EstadisticaClave(**kpi))
                logger.info(f"Added KPI: {kpi['clave']}")

        session.commit()
        logger.info(f"Alternativas pipeline completed: {count} alternatives + {len(TOURISM_KPIS)} KPIs upserted")
    except Exception as e:
        session.rollback()
        logger.error(f"Error in alternativas pipeline: {e}")
        raise
    finally:
        session.close()

    return count
