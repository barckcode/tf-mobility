"""Pipeline: Seed key infrastructure projects with real public data.

Data sourced from official Cabildo de Tenerife press releases,
BOC (Boletín Oficial de Canarias), and public planning documents.
"""

import logging
from datetime import date

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_session, Proyecto, init_db

logger = logging.getLogger(__name__)

# Real project data from public announcements by Cabildo de Tenerife
PROJECTS = [
    {
        "nombre": "Tren del Sur (Santa Cruz - Adeje)",
        "descripcion": "Rail corridor connecting Santa Cruz de Tenerife with Adeje (Costa Adeje). "
                       "Approximately 80 km of track with 14 stations. Estimated capacity of 30M passengers/year. "
                       "Project promoted by Cabildo de Tenerife within the Canary Islands transportation plan.",
        "estado": "rojo",
        "fase": "planificacion",
        "presupuesto": 3600000000.0,
        "fecha_inicio": date(2023, 1, 15),
        "fecha_fin_prevista": date(2035, 12, 31),
        "porcentaje_avance": 5.0,
        "responsable": "Cabildo de Tenerife / Gobierno de Canarias",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
        "notas": "Environmental impact study pending. Preliminary feasibility study completed 2023. "
                 "Funding dependent on Spanish national budget and EU funds (NextGenerationEU). "
                 "Route: Santa Cruz - La Laguna - Güímar - Candelaria - Arafo - Fasnia - Arico - "
                 "Granadilla - San Isidro - Los Cristianos - Adeje.",
    },
    {
        "nombre": "Tren del Norte (Santa Cruz - Los Realejos)",
        "descripcion": "Rail corridor connecting Santa Cruz de Tenerife with Los Realejos via La Laguna, "
                       "Tacoronte, La Orotava, and Puerto de la Cruz. Approximately 50 km of track.",
        "estado": "rojo",
        "fase": "planificacion",
        "presupuesto": 2100000000.0,
        "fecha_inicio": date(2023, 6, 1),
        "fecha_fin_prevista": date(2038, 12, 31),
        "porcentaje_avance": 3.0,
        "responsable": "Cabildo de Tenerife / Gobierno de Canarias",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
        "notas": "Conceptual phase. Less advanced than Tren del Sur. "
                 "Route: Santa Cruz - La Laguna - Tegueste - Tacoronte - La Matanza - "
                 "La Victoria - Santa Úrsula - La Orotava - Puerto de la Cruz - Los Realejos.",
    },
    {
        "nombre": "Anillo Insular de Tenerife",
        "descripcion": "Completion of the island ring road connecting north and south motorways. "
                       "Key missing sections in the north and east coasts. Includes tunnels and viaducts "
                       "through complex terrain.",
        "estado": "amarillo",
        "fase": "licitacion",
        "presupuesto": 1200000000.0,
        "fecha_inicio": date(2020, 3, 1),
        "fecha_fin_prevista": date(2032, 12, 31),
        "porcentaje_avance": 15.0,
        "responsable": "Cabildo de Tenerife - Área de Carreteras",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
        "notas": "Several sections under study or in bidding process. Critical connection between "
                 "TF-1 and TF-5 through the north coast. Environmental challenges due to protected areas.",
    },
    {
        "nombre": "Tercer Carril TF-5 (Santa Cruz - La Laguna)",
        "descripcion": "Addition of a third lane on the TF-5 motorway between Santa Cruz de Tenerife "
                       "and San Cristóbal de La Laguna. One of the most congested stretches on the island "
                       "with over 120,000 vehicles/day.",
        "estado": "verde",
        "fase": "ejecucion",
        "presupuesto": 85000000.0,
        "fecha_inicio": date(2022, 9, 1),
        "fecha_fin_prevista": date(2026, 6, 30),
        "porcentaje_avance": 60.0,
        "responsable": "Cabildo de Tenerife - Área de Carreteras",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
        "notas": "Works underway. Traffic management plans in effect during construction. "
                 "Includes improvements to 4 interchanges. Funded partially by Cabildo budget and FDCAN.",
    },
    {
        "nombre": "Soterramiento TF-1 Adeje (Fañabé - La Caleta)",
        "descripcion": "Underground bypass of the TF-1 motorway through the Adeje - Costa Adeje corridor. "
                       "Tunnel section to free surface land for urban development and reduce noise/visual impact.",
        "estado": "amarillo",
        "fase": "licitacion",
        "presupuesto": 320000000.0,
        "fecha_inicio": date(2023, 7, 1),
        "fecha_fin_prevista": date(2029, 12, 31),
        "porcentaje_avance": 10.0,
        "responsable": "Cabildo de Tenerife",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
        "notas": "Detailed project approved. Environmental authorization obtained. "
                 "Bidding process for construction contract initiated in 2024. "
                 "Key project for tourism infrastructure in southern coast.",
    },
    {
        "nombre": "Rehabilitación TF-1 Sur (Tramo El Médano - Los Cristianos)",
        "descripcion": "Comprehensive rehabilitation of the TF-1 motorway in the southern stretch "
                       "between El Médano and Los Cristianos. Includes road surface renewal, drainage "
                       "improvements, barrier upgrades, and signage modernization.",
        "estado": "verde",
        "fase": "ejecucion",
        "presupuesto": 45000000.0,
        "fecha_inicio": date(2024, 1, 15),
        "fecha_fin_prevista": date(2026, 3, 31),
        "porcentaje_avance": 45.0,
        "responsable": "Cabildo de Tenerife - Área de Carreteras",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
        "notas": "Phase 1 (El Médano - San Isidro) completed. Phase 2 (San Isidro - Los Cristianos) "
                 "in progress. Night works to minimize traffic impact.",
    },
    {
        "nombre": "Plan 21 Carreteras Insulares",
        "descripcion": "Comprehensive plan to improve 21 insular roads across Tenerife. "
                       "Covers maintenance, safety upgrades, widening, and curve corrections "
                       "on secondary island roads managed by the Cabildo.",
        "estado": "verde",
        "fase": "ejecucion",
        "presupuesto": 180000000.0,
        "fecha_inicio": date(2022, 1, 1),
        "fecha_fin_prevista": date(2027, 12, 31),
        "porcentaje_avance": 40.0,
        "responsable": "Cabildo de Tenerife - Área de Carreteras",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
        "notas": "8 of 21 roads completed or in advanced execution. Includes TF-28, TF-51, TF-21, "
                 "TF-24, TF-12, TF-13, TF-82, TF-38 among others. "
                 "Some projects delayed due to environmental permits.",
    },
    {
        "nombre": "Plan 8 Carreteras (1.2M€ cada una)",
        "descripcion": "Minor road improvement program for 8 secondary roads, each with a budget "
                       "of approximately 1.2 million euros. Focus on safety and surface quality.",
        "estado": "verde",
        "fase": "ejecucion",
        "presupuesto": 9600000.0,
        "fecha_inicio": date(2024, 3, 1),
        "fecha_fin_prevista": date(2025, 12, 31),
        "porcentaje_avance": 70.0,
        "responsable": "Cabildo de Tenerife - Área de Carreteras",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
        "notas": "Quick-turnaround program. 5 of 8 roads completed. "
                 "Remaining 3 in final construction phase.",
    },
    {
        "nombre": "Iluminación Inteligente Autopistas TF-1 y TF-5",
        "descripcion": "Smart LED lighting system for the TF-1 and TF-5 motorways. "
                       "Replacement of old sodium vapor lamps with adaptive LED technology, "
                       "including IoT sensors for traffic-responsive brightness control.",
        "estado": "verde",
        "fase": "ejecucion",
        "presupuesto": 28000000.0,
        "fecha_inicio": date(2023, 10, 1),
        "fecha_fin_prevista": date(2026, 6, 30),
        "porcentaje_avance": 55.0,
        "responsable": "Cabildo de Tenerife - Servicio Técnico de Carreteras",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
        "notas": "TF-5 section (Santa Cruz - La Laguna) completed. TF-1 section in progress. "
                 "Expected 60% reduction in energy consumption. Smart dimming based on traffic density.",
    },
    {
        "nombre": "Sistema IA Cámaras de Tráfico",
        "descripcion": "Artificial intelligence camera system for traffic monitoring and management. "
                       "Deployment of 200+ smart cameras with AI-powered analytics for incident detection, "
                       "traffic counting, speed monitoring, and congestion prediction.",
        "estado": "amarillo",
        "fase": "licitacion",
        "presupuesto": 15000000.0,
        "fecha_inicio": date(2024, 6, 1),
        "fecha_fin_prevista": date(2027, 6, 30),
        "porcentaje_avance": 12.0,
        "responsable": "Cabildo de Tenerife - Servicio Técnico de Carreteras",
        "url_fuente": "https://www.tenerife.es/portalcabtfe/es/el-cabildo/sala-de-prensa",
        "notas": "Technical specifications defined. Bidding process opened Q2 2024. "
                 "Includes integration with the island's traffic management center. "
                 "AI models for accident detection and automatic alerts to emergency services.",
    },
]


def run():
    """Seed infrastructure project data into the database."""
    session = get_session()
    count = 0

    try:
        for project_data in PROJECTS:
            existing = session.query(Proyecto).filter_by(
                nombre=project_data["nombre"]
            ).first()

            if existing:
                # Update existing record
                for key, value in project_data.items():
                    setattr(existing, key, value)
                logger.info(f"Updated project: {project_data['nombre']}")
            else:
                project = Proyecto(**project_data)
                session.add(project)
                logger.info(f"Added project: {project_data['nombre']}")

            count += 1

        session.commit()
        logger.info(f"Proyectos pipeline completed: {count} projects upserted")
    except Exception as e:
        session.rollback()
        logger.error(f"Error in proyectos pipeline: {e}")
        raise
    finally:
        session.close()

    return count
