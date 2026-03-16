"""Pipeline: Fetch IMD (Intensidad Media Diaria) traffic data from datos.tenerife.es.

Real data source:
- Cabildo de Tenerife Open Data Portal: https://datos.tenerife.es/
- CKAN API for dataset discovery and resource download.
- Dataset: Intensidad Media Diaria de Trafico (annual JSON files).
- Dataset ID: 1717bda1-6b7b-43e0-be4e-e3ed060b8b97

The data contains traffic counting station readings for all major roads in Tenerife,
including total daily traffic (IMD), directional splits, heavy vehicles, and speed.
"""

import logging
import sys
import os
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_session, EstacionAforo, Carretera
from utils import fetch_json, fetch_json_cached, create_http_session

logger = logging.getLogger(__name__)

# CKAN API endpoint for the IMD dataset
CKAN_PACKAGE_URL = (
    "https://datos.tenerife.es/ckan/api/action/package_show"
)
IMD_DATASET_ID = "1717bda1-6b7b-43e0-be4e-e3ed060b8b97"

# Known resource IDs as fallback (in case CKAN API is down)
KNOWN_RESOURCES = {
    2025: {
        "id": "fe0ca0cd-ce15-4aa9-8c83-64944de91097",
        "url": (
            "https://datos.tenerife.es/ckan/dataset/"
            "1717bda1-6b7b-43e0-be4e-e3ed060b8b97/resource/"
            "fe0ca0cd-ce15-4aa9-8c83-64944de91097/download/"
            "intensidad-media-diaria-de-trafico-2025.json"
        ),
    },
    2024: {
        "id": "8a5bbf2d-4e55-4dc2-b35e-94c44b100ae9",
        "url": (
            "https://datos.tenerife.es/ckan/dataset/"
            "1717bda1-6b7b-43e0-be4e-e3ed060b8b97/resource/"
            "8a5bbf2d-4e55-4dc2-b35e-94c44b100ae9/download/"
            "intensidad-media-diaria-de-trafico-2024.json"
        ),
    },
    2023: {
        "id": "1d1ce059-cabd-4fd1-8aba-73c6e262a45c",
        "url": (
            "https://datos.tenerife.es/ckan/dataset/"
            "1717bda1-6b7b-43e0-be4e-e3ed060b8b97/resource/"
            "1d1ce059-cabd-4fd1-8aba-73c6e262a45c/download/"
            "intensidad-media-diaria-de-trafico-2023.json"
        ),
    },
}


def _discover_resources(http_session) -> dict[int, str]:
    """Discover available IMD resources from CKAN API.

    Returns a dict mapping year -> download_url.
    """
    resources = {}

    data = fetch_json(
        CKAN_PACKAGE_URL,
        params={"id": IMD_DATASET_ID},
        session=http_session,
    )

    if not data or not data.get("success"):
        logger.warning("CKAN package_show failed — will use known resource URLs as fallback")
        return {year: info["url"] for year, info in KNOWN_RESOURCES.items()}

    result = data.get("result", {})
    resource_list = result.get("resources", [])

    logger.info(f"CKAN dataset has {len(resource_list)} resources")

    for res in resource_list:
        name = (res.get("name") or res.get("description") or "").lower()
        url = res.get("url", "")
        res_format = (res.get("format") or "").upper()

        # Only process JSON resources
        if res_format not in ("JSON", "") and not url.lower().endswith(".json"):
            continue

        # Extract year from resource name or URL
        year = _extract_year(name, url)
        if year and year >= 2020:
            resources[year] = url
            logger.info(f"  Discovered IMD resource: {year} -> {url}")

    if not resources:
        logger.warning("No JSON resources discovered from CKAN — using known fallback URLs")
        return {year: info["url"] for year, info in KNOWN_RESOURCES.items()}

    return resources


def _extract_year(name: str, url: str) -> Optional[int]:
    """Extract a 4-digit year from resource name or URL."""
    import re
    for text in [name, url]:
        match = re.search(r"20[12]\d", text)
        if match:
            return int(match.group(0))
    return None


def _parse_imd_json(data: dict, year: int) -> list[dict]:
    """Parse the IMD JSON structure into flat station records.

    Expected structure:
    {
        "carreteras": [
            {
                "carretera_codigo": "TF-1",
                "tramos": [
                    {
                        "tramo_nombre": "Adeje",
                        "estaciones": [
                            {
                                "estacion_id": 65,
                                "estacion_nombre": "FANABE",
                                "velocidad_media": 89.74,
                                "valores": {
                                    "imd_total": 76831,
                                    "imd_ascendentes": 39201.0,
                                    "imd_descendentes": 37630.0,
                                    "imd_pesados": 2135
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }
    """
    records = []
    carreteras = data.get("carreteras", [])

    if not carreteras:
        logger.warning(f"No 'carreteras' key found in IMD JSON for year {year}")
        # Try alternative top-level structure
        if isinstance(data, list):
            carreteras = data
        else:
            return records

    for road in carreteras:
        carretera_codigo = road.get("carretera_codigo", "").strip().upper()
        tramos = road.get("tramos", [])

        for tramo in tramos:
            tramo_nombre = tramo.get("tramo_nombre", "")
            estaciones = tramo.get("estaciones", [])

            for station in estaciones:
                estacion_id = station.get("estacion_id")
                if estacion_id is None:
                    continue

                raw_valores = station.get("valores", {})
                # valores can be a list (with one dict) or a dict directly
                if isinstance(raw_valores, list):
                    valores = raw_valores[0] if raw_valores else {}
                else:
                    valores = raw_valores

                record = {
                    "anio": year,
                    "carretera": carretera_codigo,
                    "tramo": tramo_nombre,
                    "estacion_id": int(estacion_id),
                    "estacion_nombre": station.get("estacion_nombre", ""),
                    "imd_total": _safe_int(valores.get("imd_total")),
                    "imd_ascendentes": _safe_float(valores.get("imd_ascendentes")),
                    "imd_descendentes": _safe_float(valores.get("imd_descendentes")),
                    "imd_pesados": _safe_int(valores.get("imd_pesados")),
                    "velocidad_media": _safe_float(station.get("velocidad_media")),
                }
                records.append(record)

    logger.info(f"Parsed {len(records)} station records for year {year}")
    return records


def _safe_int(val) -> Optional[int]:
    """Safely convert a value to int."""
    if val is None:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def _safe_float(val) -> Optional[float]:
    """Safely convert a value to float."""
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def _update_road_imd(db_session):
    """Update the Carretera table with the highest IMD value per road.

    For each road code (TF-X), find the station with the highest imd_total
    from the most recent year and update the carretera.imd field.
    """
    from sqlalchemy import func

    # Find the most recent year with data
    latest_year = (
        db_session.query(func.max(EstacionAforo.anio))
        .scalar()
    )
    if not latest_year:
        logger.info("No IMD data available to update road table")
        return

    # Get max IMD per road for the latest year
    road_imd = (
        db_session.query(
            EstacionAforo.carretera,
            func.max(EstacionAforo.imd_total).label("max_imd"),
        )
        .filter(EstacionAforo.anio == latest_year)
        .filter(EstacionAforo.carretera.isnot(None))
        .filter(EstacionAforo.carretera != "")
        .group_by(EstacionAforo.carretera)
        .all()
    )

    updated = 0
    for road_code, max_imd in road_imd:
        if not max_imd:
            continue

        existing = db_session.query(Carretera).filter_by(codigo=road_code).first()
        if existing:
            existing.imd = max_imd
            updated += 1
            logger.debug(f"Updated {road_code} IMD = {max_imd:,}")

    if updated:
        db_session.commit()
        logger.info(f"Updated IMD for {updated} roads from {latest_year} data")


def run() -> int:
    """Fetch real IMD traffic data from datos.tenerife.es and upsert into database.

    Strategy:
    1. Discover available resources via CKAN API (with fallback to known URLs).
    2. Download and parse JSON for each available year.
    3. Upsert station records into estaciones_aforo table.
    4. Update the Carretera table with peak IMD values per road.

    Returns the count of records processed.
    """
    http_session = create_http_session()

    # 1. Discover resources
    resources = _discover_resources(http_session)
    if not resources:
        logger.warning(
            "No IMD resources discovered. "
            "Keeping existing data in database (fallback: no delete)."
        )
        return 0

    # 2. Fetch and parse all available years
    all_records = []
    for year, url in sorted(resources.items()):
        logger.info(f"Fetching IMD data for {year}")
        data = fetch_json_cached(
            url,
            session=http_session,
            timeout=(10, 120),
            cache_subdir="ckan/imd",
            cache_filename=f"imd_{year}",
        )
        if data is None:
            logger.warning(f"Failed to fetch IMD data for {year} — skipping")
            continue

        records = _parse_imd_json(data, year)
        all_records.extend(records)

    if not all_records:
        logger.warning(
            "No IMD records parsed from any year. "
            "Keeping existing data in database (fallback: no delete)."
        )
        return 0

    # 3. Upsert into database
    db_session = get_session()
    count = 0

    try:
        for rec in all_records:
            existing = db_session.query(EstacionAforo).filter_by(
                anio=rec["anio"], estacion_id=rec["estacion_id"]
            ).first()

            if existing:
                for key, value in rec.items():
                    if value is not None:
                        setattr(existing, key, value)
                logger.debug(
                    f"Updated station: {rec['carretera']} #{rec['estacion_id']} "
                    f"({rec['estacion_nombre']}) {rec['anio']} IMD={rec['imd_total']}"
                )
            else:
                station = EstacionAforo(**rec)
                db_session.add(station)
                logger.debug(
                    f"Added station: {rec['carretera']} #{rec['estacion_id']} "
                    f"({rec['estacion_nombre']}) {rec['anio']} IMD={rec['imd_total']}"
                )

            count += 1

        db_session.commit()
        logger.info(f"Trafico IMD pipeline: {count} station records upserted")

        # 4. Update road IMD values
        _update_road_imd(db_session)

    except Exception as e:
        db_session.rollback()
        logger.error(f"Error in trafico_imd pipeline: {e}", exc_info=True)
        raise
    finally:
        db_session.close()

    return count
