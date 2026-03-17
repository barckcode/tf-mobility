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
        "usuarios_anuales": 25000000,
        "dato_clave": (
            "~25M pasajeros/año (2024). Línea 1: Santa Cruz - La Laguna (12,5 km). "
            "Línea 2: La Cuesta - Tíncer (3,6 km). 25 paradas en total (GTFS). Frecuencia en hora punta: cada 4,5 minutos. "
            "86% de usuarios redujeron uso del coche. Valoración: 8,18/10."
        ),
        "descripcion": (
            "Sistema de tranvía que conecta Santa Cruz de Tenerife y San Cristóbal "
            "de La Laguna. Línea 1 inaugurada en 2007, Línea 2 en 2009. Funciona a diario "
            "aproximadamente de 6:00 a 0:00. Frecuencia: 5-10 min en hora punta, 15 min fuera de punta. "
            "El único sistema tranviario de Canarias. Gestionado por "
            "Metrotenerife S.A., empresa pública del Cabildo de Tenerife."
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
        "usuarios_anuales": 80000000,
        "dato_clave": (
            "~80M pasajeros/año (2024, récord histórico). 177 rutas, 3.854 paradas. "
            "42M km recorridos. 342 nuevas guaguas adquiridas desde 2023. "
            "Edad media flota: 6,2 años. Programa de gratuidad activo."
        ),
        "descripcion": (
            "Red integral de guaguas interurbanas y urbanas operada por TITSA, "
            "el mayor operador de transporte público de Tenerife. 177 líneas "
            "que cubren todos los municipios. Principales nodos: Santa Cruz, La Laguna, "
            "Puerto de la Cruz, Los Cristianos, Costa Adeje. Tarifas fuertemente subvencionadas "
            "desde 2022 (subvención de transporte gratuito del Gobierno de Canarias). "
            "Utiliza la tarjeta de billetaje integrado TenMas."
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
            "Más de 13.000 usuarios. Transporte a demanda para zonas rurales de medianías "
            "mal atendidas por las líneas convencionales de guaguas. Activo en más de 4 zonas."
        ),
        "descripcion": (
            "Servicio de transporte a demanda para zonas rurales y de medianías "
            "mal atendidas por las líneas convencionales de guaguas. Los usuarios reservan "
            "viajes mediante app o teléfono. Lanzado en 2021, ampliado a más de 4 zonas en 2024. "
            "Da servicio a zonas como Anaga, Teno y áreas rurales de medianías. "
            "Servicio clave para personas mayores y con movilidad reducida."
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
            "Primer tramo estimado: Santa Cruz - Adeje, ~80 km. "
            "Presupuesto: ~3.600M EUR (estimación del Plan de Movilidad). "
            "Actualmente en fase de estudio informativo. Sin fecha de inicio de obras."
        ),
        "descripcion": (
            "Gran proyecto ferroviario que conectaría Santa Cruz con la costa sur turística. "
            "Incluido en el Plan de Movilidad Sostenible de Tenerife 2024-2035. "
            "Anunciado por primera vez hace décadas, actualmente en fase de estudio preliminar. "
            "Nunca se ha iniciado construcción física alguna. Financiación dependiente de "
            "presupuestos nacionales y europeos."
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
            "Estimado: Santa Cruz - Los Realejos, ~50 km. "
            "Presupuesto: ~2.100M EUR. Concurso de ideas "
            "lanzado en 2025. Menos avanzado que el Tren del Sur."
        ),
        "descripcion": (
            "Proyecto ferroviario que conectaría Santa Cruz con la costa norte vía "
            "La Laguna, Tacoronte y el Valle de La Orotava. Incluido en el "
            "Plan de Movilidad Sostenible de Tenerife 2024-2035. "
            "Concurso de ideas lanzado en 2025. En fase conceptual."
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
            "Sin red ciclista continua a nivel insular. Tramos fragmentados en "
            "algunos municipios (Santa Cruz, La Laguna, Adeje, Arona). "
            "El relieve y el clima son barreras significativas."
        ),
        "descripcion": (
            "La infraestructura ciclista en Tenerife es fragmentada e insuficiente. "
            "Algunos municipios han construido tramos cortos, pero no existe una "
            "red continua que conecte los principales núcleos de población. El relieve "
            "pronunciado y el calor en el sur son barreras adicionales. El alquiler de bicicletas "
            "eléctricas crece en zonas turísticas, pero sigue siendo minoritario."
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
            "Solo 89 licencias Uber activas (desde julio 2023), exclusivamente en la zona sur: "
            "Adeje, Arona, Granadilla, Guía de Isora y Aeropuerto Sur. Cabify y Bolt NO operan "
            "en Canarias. 9.000 solicitudes VTC bloqueadas. Moratoria del Gobierno de Canarias en vigor."
        ),
        "descripcion": (
            "Los servicios de VTC (Vehículo de Turismo con Conductor) tienen presencia muy "
            "limitada en Tenerife. Solo Uber opera con 89 licencias activas desde julio 2023, "
            "exclusivamente en municipios del sur turístico (Adeje, Arona, Granadilla, "
            "Guía de Isora) y el Aeropuerto Sur. Cabify y Bolt no operan en Canarias. "
            "El Gobierno de Canarias mantiene una moratoria que ha bloqueado más de 9.000 "
            "solicitudes de nuevas licencias VTC. La ratio VTC/taxi es de 1:13,2, "
            "una de las más bajas de España."
        ),
        "color": "#6C757D",
        "icono": "vtc",
        "url_fuente": "https://www.uber.com/es/es/ride/",
    },
    {
        "nombre": "Taxi",
        "tipo": "privado",
        "estado": "operativo",
        "operador": "Autónomos / Cooperativas locales",
        "cobertura": "Toda la isla (concentración en zona metropolitana y turística)",
        "usuarios_anuales": 0,
        "dato_clave": (
            "~2.266 licencias de taxi en Canarias (2026). Santa Cruz de Tenerife: ~900 licencias, "
            "con un plan de rescate de 151 licencias (2023-2026) por valor de 6M€. "
            "Solo 11 taxis adaptados para movilidad reducida. INE registró 6.130 taxis en Canarias en 2019."
        ),
        "descripcion": (
            "Servicio de taxi regulado por los ayuntamientos. La oferta se concentra en las zonas "
            "turísticas del sur y el área metropolitana de Santa Cruz - La Laguna. El Ayuntamiento de "
            "Santa Cruz tiene en marcha un plan de rescate de licencias (2023-2026) ante la caída de "
            "actividad. La ratio de VTC por taxi en Canarias es de 1 VTC por cada 13,2 taxis, "
            "una de las más bajas de España. No existe una app unificada de taxi para toda la isla."
        ),
        "color": "#F5A623",
        "icono": "taxi",
        "url_fuente": "https://www.santacruzdetenerife.es/web/servicios-municipales/movilidad-y-accesibilidad-universal/transporte-publico-auto-taxi",
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
    {
        "clave": "indice_motorizacion_tenerife",
        "valor": "839",
        "unidad": "vehiculos/1000 habitantes",
        "fuente": "Observatorio de Movilidad Metropolitana (OMM) - Informe 2023",
        "fecha_dato": date(2023, 12, 31),
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
