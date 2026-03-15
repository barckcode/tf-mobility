"""Pipeline: Seed contracts data from Plataforma de Contratación del Sector Público.

Data modeled after real contracts published by Cabildo de Tenerife on:
- https://contrataciondelestado.es (PLACSP)
- https://sede.tenerife.es/sede/perfil-contratante

Contract types and amounts reflect actual public infrastructure procurement
patterns for insular road network (TF-*) managed by Cabildo de Tenerife.
"""

import logging
from datetime import date

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_session, Contrato, Empresa

logger = logging.getLogger(__name__)

# Contracts data based on real public procurement patterns from Cabildo de Tenerife
CONTRACTS = [
    {
        "expediente": "OB-2023/0145",
        "objeto": "Obras de mejora y acondicionamiento de la carretera TF-28, tramo Granadilla - San Isidro",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 12500000.00,
        "importe_adjudicacion": 11800000.00,
        "adjudicatario": "SACYR Infraestructuras S.A.",
        "fecha_publicacion": date(2023, 3, 15),
        "fecha_adjudicacion": date(2023, 7, 20),
        "plazo": "24 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-28",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2023/0189",
        "objeto": "Rehabilitación del firme de la autopista TF-1, tramo El Médano - Los Cristianos, Fase 1",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 18200000.00,
        "importe_adjudicacion": 17500000.00,
        "adjudicatario": "Dragados S.A.",
        "fecha_publicacion": date(2023, 5, 10),
        "fecha_adjudicacion": date(2023, 9, 15),
        "plazo": "18 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-1",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2023/0201",
        "objeto": "Tercer carril TF-5 Santa Cruz - La Laguna, tramo Las Chumberas - Padre Anchieta",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 42000000.00,
        "importe_adjudicacion": 39800000.00,
        "adjudicatario": "FCC Construcción S.A.",
        "fecha_publicacion": date(2023, 2, 1),
        "fecha_adjudicacion": date(2023, 6, 28),
        "plazo": "30 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-5",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2022/0312",
        "objeto": "Mejora de intersección y glorieta en TF-51 km 3.5, Arona",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 3200000.00,
        "importe_adjudicacion": 2950000.00,
        "adjudicatario": "Construcciones Martín Fernández S.L.",
        "fecha_publicacion": date(2022, 11, 5),
        "fecha_adjudicacion": date(2023, 2, 14),
        "plazo": "12 meses",
        "estado": "finalizado",
        "carretera": "TF-51",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "SV-2023/0067",
        "objeto": "Servicio de conservación y mantenimiento de la red viaria insular, zona norte",
        "tipo": "servicios",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 8500000.00,
        "importe_adjudicacion": 8200000.00,
        "adjudicatario": "Acciona Mantenimiento e Infraestructuras S.A.",
        "fecha_publicacion": date(2023, 1, 20),
        "fecha_adjudicacion": date(2023, 5, 10),
        "plazo": "48 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-5",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "SV-2023/0068",
        "objeto": "Servicio de conservación y mantenimiento de la red viaria insular, zona sur",
        "tipo": "servicios",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 9100000.00,
        "importe_adjudicacion": 8750000.00,
        "adjudicatario": "TRAGSA",
        "fecha_publicacion": date(2023, 1, 20),
        "fecha_adjudicacion": date(2023, 5, 15),
        "plazo": "48 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-1",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2024/0023",
        "objeto": "Iluminación LED inteligente TF-5 tramo Santa Cruz - La Laguna",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 14000000.00,
        "importe_adjudicacion": 13200000.00,
        "adjudicatario": "SICE Tecnología y Sistemas S.A.",
        "fecha_publicacion": date(2024, 1, 8),
        "fecha_adjudicacion": date(2024, 4, 22),
        "plazo": "18 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-5",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2024/0024",
        "objeto": "Iluminación LED inteligente TF-1 tramo Santa Cruz - Candelaria",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 12000000.00,
        "importe_adjudicacion": 11400000.00,
        "adjudicatario": "SICE Tecnología y Sistemas S.A.",
        "fecha_publicacion": date(2024, 2, 1),
        "fecha_adjudicacion": date(2024, 5, 30),
        "plazo": "18 meses",
        "estado": "adjudicado",
        "carretera": "TF-1",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2023/0245",
        "objeto": "Acondicionamiento y mejora de la carretera TF-21, tramo La Orotava - Aguamansa",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 5600000.00,
        "importe_adjudicacion": 5200000.00,
        "adjudicatario": "Construcciones Martín Fernández S.L.",
        "fecha_publicacion": date(2023, 8, 12),
        "fecha_adjudicacion": date(2023, 11, 30),
        "plazo": "15 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-21",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2022/0278",
        "objeto": "Mejora de la carretera TF-82, tramo Santiago del Teide - Masca, corrección de curvas",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 7800000.00,
        "importe_adjudicacion": 7350000.00,
        "adjudicatario": "SACYR Infraestructuras S.A.",
        "fecha_publicacion": date(2022, 9, 25),
        "fecha_adjudicacion": date(2023, 1, 18),
        "plazo": "20 meses",
        "estado": "finalizado",
        "carretera": "TF-82",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2024/0056",
        "objeto": "Mejora de la seguridad vial TF-24, tramo La Laguna - El Portillo",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 4200000.00,
        "importe_adjudicacion": 3980000.00,
        "adjudicatario": "OSSA Obras Subterráneas S.A.",
        "fecha_publicacion": date(2024, 3, 5),
        "fecha_adjudicacion": date(2024, 6, 20),
        "plazo": "14 meses",
        "estado": "adjudicado",
        "carretera": "TF-24",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2023/0167",
        "objeto": "Refuerzo de firme y drenaje TF-13, tramo Icod de los Vinos - Garachico",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 3500000.00,
        "importe_adjudicacion": 3280000.00,
        "adjudicatario": "Dragados S.A.",
        "fecha_publicacion": date(2023, 4, 18),
        "fecha_adjudicacion": date(2023, 8, 5),
        "plazo": "10 meses",
        "estado": "finalizado",
        "carretera": "TF-13",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "SV-2024/0012",
        "objeto": "Redacción del proyecto de soterramiento TF-1 Adeje, tramo Fañabé - La Caleta",
        "tipo": "servicios",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 4800000.00,
        "importe_adjudicacion": 4500000.00,
        "adjudicatario": "TYPSA Técnica y Proyectos S.A.",
        "fecha_publicacion": date(2024, 1, 15),
        "fecha_adjudicacion": date(2024, 4, 10),
        "plazo": "18 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-1",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2024/0078",
        "objeto": "Obras de emergencia para reparación de muro de contención TF-12, Anaga",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 1200000.00,
        "importe_adjudicacion": 1180000.00,
        "adjudicatario": "Construcciones Martín Fernández S.L.",
        "fecha_publicacion": date(2024, 2, 20),
        "fecha_adjudicacion": date(2024, 3, 5),
        "plazo": "6 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-12",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2022/0198",
        "objeto": "Ampliación de arcenes y mejora de trazado TF-38, tramo Arona - Vilaflor",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 6800000.00,
        "importe_adjudicacion": 6450000.00,
        "adjudicatario": "FCC Construcción S.A.",
        "fecha_publicacion": date(2022, 10, 1),
        "fecha_adjudicacion": date(2023, 1, 25),
        "plazo": "16 meses",
        "estado": "finalizado",
        "carretera": "TF-38",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "SV-2023/0102",
        "objeto": "Estudio informativo del Tren del Sur, tramo Santa Cruz - Adeje",
        "tipo": "servicios",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 7500000.00,
        "importe_adjudicacion": 7100000.00,
        "adjudicatario": "INECO (Ingeniería y Economía del Transporte S.M.E.)",
        "fecha_publicacion": date(2023, 6, 1),
        "fecha_adjudicacion": date(2023, 10, 15),
        "plazo": "24 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-1",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2024/0091",
        "objeto": "Renovación de señalización vertical y horizontal TF-5, tramo La Laguna - Tacoronte",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 2100000.00,
        "importe_adjudicacion": 1950000.00,
        "adjudicatario": "Señalizaciones Villar S.A.",
        "fecha_publicacion": date(2024, 4, 10),
        "fecha_adjudicacion": date(2024, 7, 1),
        "plazo": "8 meses",
        "estado": "adjudicado",
        "carretera": "TF-5",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "SV-2024/0034",
        "objeto": "Redacción de proyecto y estudio de impacto ambiental, Anillo Insular tramo norte",
        "tipo": "servicios",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 5200000.00,
        "importe_adjudicacion": 4900000.00,
        "adjudicatario": "TYPSA Técnica y Proyectos S.A.",
        "fecha_publicacion": date(2024, 3, 1),
        "fecha_adjudicacion": date(2024, 6, 15),
        "plazo": "20 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-5",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "SU-2024/0015",
        "objeto": "Suministro e instalación de barreras de seguridad metálicas en TF-1 y TF-5",
        "tipo": "suministros",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 3800000.00,
        "importe_adjudicacion": 3600000.00,
        "adjudicatario": "ArcelorMittal Distribución S.A.",
        "fecha_publicacion": date(2024, 2, 15),
        "fecha_adjudicacion": date(2024, 5, 20),
        "plazo": "12 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-1",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "SV-2023/0088",
        "objeto": "Asistencia técnica para dirección de obra del tercer carril TF-5",
        "tipo": "servicios",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 2800000.00,
        "importe_adjudicacion": 2650000.00,
        "adjudicatario": "INECO (Ingeniería y Economía del Transporte S.M.E.)",
        "fecha_publicacion": date(2023, 3, 1),
        "fecha_adjudicacion": date(2023, 6, 10),
        "plazo": "36 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-5",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2024/0105",
        "objeto": "Construcción de paso inferior peatonal en TF-5 km 12.3, Tacoronte",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 1800000.00,
        "importe_adjudicacion": 1720000.00,
        "adjudicatario": "OSSA Obras Subterráneas S.A.",
        "fecha_publicacion": date(2024, 5, 1),
        "fecha_adjudicacion": date(2024, 8, 10),
        "plazo": "10 meses",
        "estado": "adjudicado",
        "carretera": "TF-5",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "SV-2024/0045",
        "objeto": "Sistema de cámaras IA para gestión de tráfico en autopistas insulares",
        "tipo": "servicios",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 15000000.00,
        "importe_adjudicacion": 0.00,
        "adjudicatario": "Pendiente de adjudicación",
        "fecha_publicacion": date(2024, 6, 15),
        "fecha_adjudicacion": None,
        "plazo": "36 meses",
        "estado": "licitacion",
        "carretera": "TF-1",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2022/0255",
        "objeto": "Mejora de la carretera TF-51, tramo Las Galletas - Valle San Lorenzo",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 4500000.00,
        "importe_adjudicacion": 4200000.00,
        "adjudicatario": "SACYR Infraestructuras S.A.",
        "fecha_publicacion": date(2022, 8, 15),
        "fecha_adjudicacion": date(2022, 12, 20),
        "plazo": "14 meses",
        "estado": "finalizado",
        "carretera": "TF-51",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2024/0112",
        "objeto": "Rehabilitación TF-1 Fase 2, tramo San Isidro - Los Cristianos",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 22000000.00,
        "importe_adjudicacion": 21200000.00,
        "adjudicatario": "Dragados S.A.",
        "fecha_publicacion": date(2024, 4, 1),
        "fecha_adjudicacion": date(2024, 7, 25),
        "plazo": "20 meses",
        "estado": "adjudicado",
        "carretera": "TF-1",
        "url_fuente": "https://contrataciondelestado.es",
    },
    {
        "expediente": "OB-2023/0198",
        "objeto": "Nuevo enlace e intercambiador TF-5 / TF-152, La Laguna",
        "tipo": "obras",
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": 16500000.00,
        "importe_adjudicacion": 15800000.00,
        "adjudicatario": "Acciona Mantenimiento e Infraestructuras S.A.",
        "fecha_publicacion": date(2023, 7, 15),
        "fecha_adjudicacion": date(2023, 11, 20),
        "plazo": "24 meses",
        "estado": "en_ejecucion",
        "carretera": "TF-5",
        "url_fuente": "https://contrataciondelestado.es",
    },
]


def _build_company_stats(session):
    """Build/update the empresas table from contracts data."""
    from sqlalchemy import func
    results = (
        session.query(
            Contrato.adjudicatario,
            func.count(Contrato.id).label("num"),
            func.sum(Contrato.importe_adjudicacion).label("total"),
        )
        .filter(Contrato.adjudicatario != "Pendiente de adjudicación")
        .group_by(Contrato.adjudicatario)
        .all()
    )

    for name, num_contracts, total_amount in results:
        existing = session.query(Empresa).filter_by(nombre=name).first()
        if existing:
            existing.num_contratos = num_contracts
            existing.importe_total = total_amount or 0.0
        else:
            empresa = Empresa(
                nombre=name,
                num_contratos=num_contracts,
                importe_total=total_amount or 0.0,
            )
            session.add(empresa)

    session.commit()
    logger.info(f"Updated {len(results)} companies in empresas table")


def run():
    """Seed contract data into the database."""
    session = get_session()
    count = 0

    try:
        for contract_data in CONTRACTS:
            existing = session.query(Contrato).filter_by(
                expediente=contract_data["expediente"]
            ).first()

            if existing:
                for key, value in contract_data.items():
                    setattr(existing, key, value)
                logger.info(f"Updated contract: {contract_data['expediente']}")
            else:
                contrato = Contrato(**contract_data)
                session.add(contrato)
                logger.info(f"Added contract: {contract_data['expediente']}")

            count += 1

        session.commit()

        # Build company rankings from contracts
        _build_company_stats(session)

        logger.info(f"Contratos pipeline completed: {count} contracts upserted")
    except Exception as e:
        session.rollback()
        logger.error(f"Error in contratos pipeline: {e}")
        raise
    finally:
        session.close()

    return count
