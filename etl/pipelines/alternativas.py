"""Pipeline: Seed transport alternatives data for Tenerife."""

import logging
from datetime import date

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_session, Alternativa, EstadisticaClave, init_db

logger = logging.getLogger(__name__)

ALTERNATIVES = [
    {
        "nombre": "Tranvía (Metrotenerife)",
        "tipo": "publico",
        "estado": "operativo",
        "operador": "Metrotenerife S.A.",
        "cobertura": "Línea 1: Santa Cruz - La Laguna (12.5 km, 21 paradas). Línea 2: La Laguna - Tincer (3.6 km, 6 paradas).",
        "usuarios_anuales": 16000000,
        "dato_clave": "16M passengers/year. Only rail-based public transport in Canary Islands.",
        "descripcion": "Light rail system connecting Santa Cruz de Tenerife and San Cristóbal de La Laguna. "
                       "Line 1 opened in 2007, Line 2 in 2009. Operates daily 6:00-0:00. "
                       "Frequency: 5-10 min peak, 15 min off-peak.",
        "color": "#E63946",
        "icono": "tram",
        "url_fuente": "https://www.metrotenerife.com",
    },
    {
        "nombre": "Guaguas (TITSA)",
        "tipo": "publico",
        "estado": "operativo",
        "operador": "TITSA (Transportes Interurbanos de Tenerife S.A.)",
        "cobertura": "Island-wide bus network. 175+ routes covering all municipalities. "
                     "Main hubs: Santa Cruz, La Laguna, Puerto de la Cruz, Los Cristianos, Costa Adeje.",
        "usuarios_anuales": 50000000,
        "dato_clave": "50M passengers/year. Free rides with State subsidy (50% discount since 2022). 1,200+ buses.",
        "descripcion": "Comprehensive intercity and urban bus network operated by TITSA. "
                       "Largest public transport operator in Tenerife. "
                       "Heavily subsidized fares since 2022 (Decreto de gratuidad del transporte). "
                       "TenMas card for integrated ticketing.",
        "color": "#2A9D8F",
        "icono": "bus",
        "url_fuente": "https://www.titsa.com",
    },
    {
        "nombre": "Transporte a Demanda",
        "tipo": "publico",
        "estado": "operativo",
        "operador": "Cabildo de Tenerife / Operadores locales",
        "cobertura": "Highland and rural zones: Anaga, Teno, Zona Alta de Arona, Zona Alta de Adeje, Vilaflor, Fasnia-Güímar.",
        "usuarios_anuales": 13000,
        "dato_clave": "13,000+ users. Demand-responsive transport for areas with low population density.",
        "descripcion": "Demand-responsive transport service for rural and highland areas "
                       "poorly served by conventional bus routes. Users book trips via app or phone. "
                       "Launched 2021, expanded to 4+ zones by 2024. Key for elderly and "
                       "mobility-reduced populations in rural Tenerife.",
        "color": "#457B9D",
        "icono": "phone",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
    },
    {
        "nombre": "Tren del Sur",
        "tipo": "futuro",
        "estado": "en_estudio",
        "operador": "Cabildo de Tenerife / Gobierno de Canarias",
        "cobertura": "Planned route: Santa Cruz - La Laguna - Güímar - Candelaria - Arico - "
                     "Granadilla - San Isidro - Los Cristianos - Adeje (~80 km).",
        "usuarios_anuales": 0,
        "dato_clave": "Estimated 30M passengers/year. Budget: 3.6B€. First section ~800M€. Planned 14 stations.",
        "descripcion": "Major rail project connecting Santa Cruz with the tourist south coast. "
                       "First announced decades ago, currently in feasibility study phase. "
                       "Environmental impact study pending. Funding dependent on national/EU budgets. "
                       "Would be transformative for island mobility.",
        "color": "#F4A261",
        "icono": "train",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
    },
    {
        "nombre": "Tren del Norte",
        "tipo": "futuro",
        "estado": "en_estudio",
        "operador": "Cabildo de Tenerife / Gobierno de Canarias",
        "cobertura": "Planned route: Santa Cruz - La Laguna - Tacoronte - La Orotava - "
                     "Puerto de la Cruz - Los Realejos (~50 km).",
        "usuarios_anuales": 0,
        "dato_clave": "Ideas competition launched 2025. Budget: ~2.1B€. Less advanced than Tren del Sur.",
        "descripcion": "Rail project connecting Santa Cruz with the north coast. "
                       "Conceptual phase, ideas competition opened in 2025. "
                       "Would serve the populous northern corridor including La Laguna, "
                       "Tacoronte, and the Orotava Valley.",
        "color": "#F4A261",
        "icono": "train",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
    },
    {
        "nombre": "Carril Bici",
        "tipo": "activo",
        "estado": "fragmentado",
        "operador": "Ayuntamientos / Cabildo de Tenerife",
        "cobertura": "Fragmented segments in Santa Cruz, La Laguna, Adeje, and Arona. "
                     "No continuous island-wide cycle network.",
        "usuarios_anuales": 0,
        "dato_clave": "No continuous network. Approximately 45 km of disconnected bike lanes across the island.",
        "descripcion": "Cycling infrastructure in Tenerife is fragmented and insufficient. "
                       "Some municipalities have built short segments, but there is no continuous "
                       "network connecting major population centers. Terrain (steep hills) "
                       "and climate (heat in south) are additional barriers. "
                       "E-bike rentals growing in tourist areas.",
        "color": "#6C757D",
        "icono": "bike",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
    },
    {
        "nombre": "Uber / VTC",
        "tipo": "privado",
        "estado": "reciente",
        "operador": "Uber / Various VTC operators",
        "cobertura": "Mainly Santa Cruz, La Laguna, and tourist south (Los Cristianos, Costa Adeje, "
                     "Las Américas). Limited coverage in rural areas.",
        "usuarios_anuales": 0,
        "dato_clave": "Recently arrived. Growing presence in tourist areas. Supplements taxi service.",
        "descripcion": "Ride-hailing services (VTC - Vehículo de Turismo con Conductor) "
                       "have recently become available in Tenerife. Growing presence especially "
                       "in tourist zones of the south coast. Complements the traditional taxi service. "
                       "Regulatory framework still evolving in the Canary Islands.",
        "color": "#343A40",
        "icono": "car",
        "url_fuente": "https://www.uber.com/es/es/ride/",
    },
]

# Additional tourism-related KPIs
TOURISM_KPIS = [
    {
        "clave": "vehiculos_alquiler_canarias",
        "valor": "100000",
        "unidad": "vehículos",
        "fuente": "ISTAC - Estimación flotas rent-a-car Canarias 2024",
        "fecha_dato": date(2024, 12, 31),
    },
    {
        "clave": "gasto_diario_turista",
        "valor": "190",
        "unidad": "€/día",
        "fuente": "ISTAC - Encuesta de Gasto Turístico 2024",
        "fecha_dato": date(2024, 12, 31),
    },
    {
        "clave": "estancia_media_turista",
        "valor": "7.6",
        "unidad": "días",
        "fuente": "ISTAC - Encuesta de Alojamiento Turístico 2024",
        "fecha_dato": date(2024, 12, 31),
    },
    {
        "clave": "turistas_anuales_2024",
        "valor": "7280000",
        "unidad": "turistas/año",
        "fuente": "ISTAC - FRONTUR Canarias 2024",
        "fecha_dato": date(2024, 12, 31),
    },
    {
        "clave": "regulacion_formentera",
        "valor": "Sí - Límite de vehículos en verano desde 2019",
        "unidad": "regulación",
        "fuente": "Consell Insular de Formentera",
        "fecha_dato": date(2024, 1, 1),
    },
    {
        "clave": "regulacion_ibiza",
        "valor": "Sí - Tasa de circulación para no residentes propuesta",
        "unidad": "regulación",
        "fuente": "Consell Insular d'Eivissa",
        "fecha_dato": date(2024, 1, 1),
    },
    {
        "clave": "regulacion_mallorca",
        "valor": "Sí - Límite de coches de alquiler desde 2024",
        "unidad": "regulación",
        "fuente": "Govern de les Illes Balears",
        "fecha_dato": date(2024, 1, 1),
    },
    {
        "clave": "regulacion_azores",
        "valor": "Sí - Tasa turística + límite de vehículos en islas pequeñas",
        "unidad": "regulación",
        "fuente": "Governo Regional dos Açores",
        "fecha_dato": date(2024, 1, 1),
    },
    {
        "clave": "regulacion_madeira",
        "valor": "Sí - Regulación de rent-a-car y emisiones",
        "unidad": "regulación",
        "fuente": "Governo Regional da Madeira",
        "fecha_dato": date(2024, 1, 1),
    },
    {
        "clave": "regulacion_canarias",
        "valor": "No - Sin regulación específica de vehículos turísticos",
        "unidad": "regulación",
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
