"""Pipeline: Fetch tourism data from ISTAC Indicators API.

Real data source:
- ISTAC Indicators API v1.0 — Tourist arrivals to Canary Islands by month and island.
- Indicator system: C00075B (Turistas que visitan Canarias)
- Indicator instance: be85e239-12f1-46c9-b42f-3533d27d03ce
- API docs: https://datos.canarias.es/api/estadisticas/indicators/v1.0/

Geographic codes (ISO): ES709=Tenerife, ES705=Gran Canaria, ES708=Lanzarote,
ES704=Fuerteventura, ES707=La Palma, ES70=Canarias (total)
"""

import logging
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_session, TurismoMensual
from utils import fetch_json, create_http_session

logger = logging.getLogger(__name__)

# ISTAC Indicators API endpoint for tourist arrivals
ISTAC_BASE_URL = (
    "https://datos.canarias.es/api/estadisticas/indicators/v1.0"
    "/indicatorsSystems/C00075B"
    "/indicatorsInstances/be85e239-12f1-46c9-b42f-3533d27d03ce/data"
)

# Islands to fetch: code -> human-readable name
ISLAND_CODES = {
    "ES709": "Tenerife",
    "ES705": "Gran Canaria",
    "ES708": "Lanzarote",
    "ES704": "Fuerteventura",
    "ES707": "La Palma",
    "ES70": "Canarias",
}

DATA_SOURCE = "ISTAC - Indicadores Estadísticos de Canarias"


def _parse_istac_response(data: dict) -> list[dict]:
    """Parse the ISTAC multidimensional observation response into flat records.

    The observation array is indexed by:
        index = geo_index + (time_index * num_geo) + (measure_index * num_geo * num_time)

    Returns a list of dicts with keys: isla_code, isla, anio, mes, turistas.
    """
    records = []

    if not data or "observation" not in data or "dimension" not in data:
        logger.error("Invalid ISTAC response structure — missing 'observation' or 'dimension'")
        return records

    observations = data["observation"]

    # Extract dimension representations
    geo_dim = data["dimension"].get("GEOGRAPHICAL", {}).get("representation", [])
    time_dim = data["dimension"].get("TIME", {}).get("representation", [])
    measure_dim = data["dimension"].get("MEASURE", {}).get("representation", [])

    num_geo = len(geo_dim)
    num_time = len(time_dim)

    # Build index maps: granularId -> position index
    geo_index_map = {}
    for item in geo_dim:
        code = item.get("granularId") or item.get("code", "")
        idx = item.get("index", 0)
        geo_index_map[code] = idx

    time_index_map = {}
    for item in time_dim:
        code = item.get("granularId") or item.get("code", "")
        idx = item.get("index", 0)
        time_index_map[code] = idx

    # Find the ABSOLUTE measure index (usually 0 if we filtered, but be safe)
    measure_idx = 0
    for item in measure_dim:
        code = item.get("granularId") or item.get("code", "")
        if "ABSOLUTE" in code.upper():
            measure_idx = item.get("index", 0)
            break

    # Iterate over all geo/time combinations
    for time_code, time_idx in time_index_map.items():
        # Parse time code: expected format "YYYY-MM" or "YYYYMM"
        try:
            if "-" in time_code:
                parts = time_code.split("-")
                anio = int(parts[0])
                mes = int(parts[1])
            elif len(time_code) == 6:
                anio = int(time_code[:4])
                mes = int(time_code[4:])
            else:
                logger.warning(f"Unexpected time code format: {time_code}, skipping")
                continue
        except (ValueError, IndexError):
            logger.warning(f"Cannot parse time code: {time_code}, skipping")
            continue

        for geo_code, geo_idx in geo_index_map.items():
            # Calculate flat array index
            obs_index = geo_idx + (time_idx * num_geo) + (measure_idx * num_geo * num_time)

            if obs_index >= len(observations):
                logger.debug(f"Index {obs_index} out of range for {geo_code}/{time_code}")
                continue

            obs_value = observations[obs_index]

            # Observation can be None or a string or a number
            if obs_value is None:
                continue

            # The value might be a string representation
            try:
                turistas = int(float(str(obs_value)))
            except (ValueError, TypeError):
                logger.debug(f"Cannot parse value for {geo_code}/{time_code}: {obs_value}")
                continue

            # Map geographic code to island name
            isla_name = ISLAND_CODES.get(geo_code, geo_code)

            records.append({
                "anio": anio,
                "mes": mes,
                "turistas": turistas,
                "isla": isla_name,
            })

    logger.info(f"Parsed {len(records)} tourism records from ISTAC response")
    return records


def _fetch_tourism_data(session) -> list[dict]:
    """Fetch tourism data from ISTAC API for all Canary Islands.

    Returns a list of parsed records or an empty list on failure.
    """
    # Build the geographic filter for all islands
    geo_codes = "|".join(ISLAND_CODES.keys())
    representation = f"GEOGRAPHICAL[{geo_codes}]:MEASURE[ABSOLUTE]"

    url = ISTAC_BASE_URL
    params = {"representation": representation}

    data = fetch_json(url, params=params, session=session)
    if data is None:
        logger.error("Failed to fetch tourism data from ISTAC API")
        return []

    return _parse_istac_response(data)


def run() -> int:
    """Fetch real tourism data from ISTAC API and upsert into database.

    Returns the count of records processed.
    """
    http_session = create_http_session()
    records = _fetch_tourism_data(http_session)

    if not records:
        logger.warning(
            "No tourism records fetched from ISTAC API. "
            "Keeping existing data in database (fallback: no delete)."
        )
        return 0

    db_session = get_session()
    count = 0

    try:
        for rec in records:
            existing = db_session.query(TurismoMensual).filter_by(
                anio=rec["anio"], mes=rec["mes"], isla=rec["isla"]
            ).first()

            fuente = DATA_SOURCE

            if existing:
                existing.turistas = rec["turistas"]
                existing.fuente = fuente
                logger.debug(
                    f"Updated tourism: {rec['isla']} {rec['anio']}/{rec['mes']:02d} = {rec['turistas']:,}"
                )
            else:
                record = TurismoMensual(
                    anio=rec["anio"],
                    mes=rec["mes"],
                    turistas=rec["turistas"],
                    isla=rec["isla"],
                    fuente=fuente,
                )
                db_session.add(record)
                logger.debug(
                    f"Added tourism: {rec['isla']} {rec['anio']}/{rec['mes']:02d} = {rec['turistas']:,}"
                )

            count += 1

        db_session.commit()
        logger.info(f"Turismo pipeline completed: {count} records upserted from ISTAC API")
    except Exception as e:
        db_session.rollback()
        logger.error(f"Error in turismo pipeline: {e}", exc_info=True)
        raise
    finally:
        db_session.close()

    return count
