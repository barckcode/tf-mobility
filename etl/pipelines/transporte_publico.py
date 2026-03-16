"""Pipeline: Parse TITSA GTFS data and compute bus stop frequencies and route corridors.

Real data source:
- TITSA GTFS feed from datos.tenerife.es (Cabildo Insular de Tenerife open data portal).
- ZIP contains: stops.txt, routes.txt, trips.txt, stop_times.txt, calendar_dates.txt, shapes.txt
- URL: https://datos.tenerife.es/ckan/dataset/.../fichero-zip-de-google-transit.zip

Processing:
1. Download GTFS ZIP (cached locally to avoid re-downloads).
2. Parse stops.txt -> ParadaGuagua (bus stops with coordinates).
3. Parse routes.txt -> RutaGuagua (bus routes with names/colors).
4. Compute FrecuenciaParada: buses/day per stop on a typical weekday.
5. Compute RutaTramo: which routes serve congested TF-* road corridors.
"""

import csv
import logging
import os
import sys
import zipfile
from collections import defaultdict
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_session, ParadaGuagua, RutaGuagua, FrecuenciaParada, RutaTramo
from utils import create_http_session, download_file

logger = logging.getLogger(__name__)

# GTFS ZIP download URL from datos.tenerife.es
GTFS_ZIP_URL = (
    "https://datos.tenerife.es/ckan/dataset/36c2e26f-0d18-4b5a-b214-1636168e0765"
    "/resource/9f291323-8b78-453a-9008-4f0e3bfb3ce3/download"
    "/fichero-zip-de-google-transit.zip"
)

# Local cache directory
CACHE_DIR = os.path.join(
    os.environ.get("ETL_CACHE_DIR", "/app/cache"),
    "titsa",
)

GTFS_ZIP_FILENAME = "titsa_gtfs.zip"
GTFS_EXTRACT_DIR = "titsa_gtfs"

# Minimum valid ZIP size (to detect error pages)
MIN_ZIP_SIZE = 50_000

# Corridor detection: map city/town names to TF-* road codes
CORRIDOR_CITIES = {
    "TF-1": [
        "adeje", "arona", "san miguel", "granadilla", "arico",
        "guimar", "güímar", "candelaria", "los cristianos",
        "costa adeje", "las americas", "las américas",
    ],
    "TF-5": [
        "la laguna", "tacoronte", "la matanza", "la victoria",
        "santa ursula", "santa úrsula", "la orotava",
        "puerto de la cruz", "los realejos", "icod",
    ],
    "TF-2": [
        "santiago del teide", "guia de isora", "guía de isora", "adeje",
    ],
    "TF-13": [
        "la laguna",
    ],
    "TF-28": [
        "granadilla", "san isidro", "arico",
    ],
}


def _download_gtfs_zip(http_session) -> str | None:
    """Download the GTFS ZIP file to cache, returning the path.

    If the file already exists and is large enough, skip download.
    Returns None if download fails.
    """
    os.makedirs(CACHE_DIR, exist_ok=True)
    zip_path = os.path.join(CACHE_DIR, GTFS_ZIP_FILENAME)

    if os.path.exists(zip_path) and os.path.getsize(zip_path) > MIN_ZIP_SIZE:
        logger.info(f"  Using cached GTFS ZIP: {zip_path}")
        return zip_path

    success = download_file(GTFS_ZIP_URL, zip_path, session=http_session, timeout=(10, 300))
    if not success:
        logger.error(f"Failed to download GTFS ZIP from {GTFS_ZIP_URL}")
        return None

    file_size = os.path.getsize(zip_path)
    if file_size < MIN_ZIP_SIZE:
        logger.warning(f"  GTFS ZIP too small ({file_size} bytes), likely not valid — removing")
        os.unlink(zip_path)
        return None

    logger.info(f"  Downloaded GTFS ZIP: {zip_path} ({file_size:,} bytes)")
    return zip_path


def _extract_gtfs_zip(zip_path: str) -> str | None:
    """Extract GTFS ZIP to a subdirectory, returning the extract path."""
    extract_dir = os.path.join(CACHE_DIR, GTFS_EXTRACT_DIR)

    # If already extracted and contains stops.txt, skip
    if os.path.isdir(extract_dir) and os.path.exists(os.path.join(extract_dir, "stops.txt")):
        logger.info(f"  Using cached GTFS extract: {extract_dir}")
        return extract_dir

    try:
        os.makedirs(extract_dir, exist_ok=True)
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_dir)
        logger.info(f"  Extracted GTFS to: {extract_dir}")
        return extract_dir
    except zipfile.BadZipFile:
        logger.error(f"Bad GTFS ZIP file: {zip_path}")
        return None
    except Exception as e:
        logger.error(f"Error extracting GTFS ZIP: {e}")
        return None


def _read_csv(gtfs_dir: str, filename: str) -> list[dict]:
    """Read a GTFS CSV file, handling BOM and returning list of dicts."""
    filepath = os.path.join(gtfs_dir, filename)
    if not os.path.exists(filepath):
        logger.warning(f"GTFS file not found: {filepath}")
        return []

    records = []
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)

    logger.info(f"  Read {len(records):,} rows from {filename}")
    return records


def _find_typical_weekday_services(calendar_dates: list[dict]) -> set[str]:
    """Find service_ids active on a typical Monday (the next Monday from today).

    Uses calendar_dates.txt (exception_type=1 means service is added for that date).
    Looks for the nearest Monday in the data to represent a typical weekday.
    """
    # Collect all dates that have service additions (exception_type=1)
    date_services = defaultdict(set)
    for row in calendar_dates:
        if row.get("exception_type") == "1":
            date_str = row.get("date", "")
            service_id = row.get("service_id", "")
            if date_str and service_id:
                date_services[date_str].add(service_id)

    if not date_services:
        logger.warning("No active service dates found in calendar_dates.txt")
        return set()

    # Find a Monday — prefer a future Monday, fall back to any Monday with most services
    mondays = {}
    for date_str, services in date_services.items():
        try:
            dt = datetime.strptime(date_str, "%Y%m%d")
            if dt.weekday() == 0:  # Monday
                mondays[date_str] = services
        except ValueError:
            continue

    if not mondays:
        # No Mondays found — use the date with the most services as fallback
        best_date = max(date_services, key=lambda d: len(date_services[d]))
        logger.warning(
            f"No Mondays found in calendar_dates.txt, using date {best_date} "
            f"with {len(date_services[best_date])} services as fallback"
        )
        return date_services[best_date]

    # Pick the Monday closest to today (preferring future dates)
    today_str = datetime.now().strftime("%Y%m%d")
    future_mondays = {d: s for d, s in mondays.items() if d >= today_str}

    if future_mondays:
        chosen = min(future_mondays.keys())
    else:
        chosen = max(mondays.keys())

    logger.info(
        f"  Typical weekday (Monday): {chosen} with {len(mondays[chosen])} active services"
    )
    return mondays[chosen]


def _compute_stop_frequencies(
    active_services: set[str],
    trips: list[dict],
    stop_times: list[dict],
) -> dict[str, dict]:
    """Compute buses/day and route count per stop for active services.

    Returns: {stop_id: {"buses_dia": int, "rutas_count": int}}
    """
    # Step 1: Find trip_ids for active services, and map trip -> route
    active_trip_ids = set()
    trip_to_route = {}
    for trip in trips:
        if trip.get("service_id") in active_services:
            trip_id = trip.get("trip_id")
            active_trip_ids.add(trip_id)
            trip_to_route[trip_id] = trip.get("route_id")

    logger.info(f"  Active trips for typical weekday: {len(active_trip_ids):,}")

    # Step 2: Count stop visits and distinct routes per stop
    stop_bus_count = defaultdict(int)
    stop_routes = defaultdict(set)

    for st in stop_times:
        trip_id = st.get("trip_id")
        if trip_id in active_trip_ids:
            stop_id = st.get("stop_id")
            stop_bus_count[stop_id] += 1
            route_id = trip_to_route.get(trip_id)
            if route_id:
                stop_routes[stop_id].add(route_id)

    # Build result
    result = {}
    for stop_id in set(stop_bus_count.keys()) | set(stop_routes.keys()):
        result[stop_id] = {
            "buses_dia": stop_bus_count.get(stop_id, 0),
            "rutas_count": len(stop_routes.get(stop_id, set())),
        }

    logger.info(f"  Computed frequencies for {len(result):,} stops")
    return result


def _detect_route_corridors(routes: list[dict]) -> list[dict]:
    """Detect which routes serve corridors near major TF-* roads.

    Matches city names in route_long_name against known corridor cities.
    Returns list of {route_id, carretera, overlap_description}.
    """
    results = []
    for route in routes:
        route_id = route.get("route_id", "")
        long_name = (route.get("route_long_name") or "").lower()
        short_name = route.get("route_short_name", "")

        if not long_name:
            continue

        for road_code, cities in CORRIDOR_CITIES.items():
            matched_cities = [city for city in cities if city in long_name]
            if matched_cities:
                description = (
                    f"Linea {short_name} serves {road_code} corridor "
                    f"via {', '.join(c.title() for c in matched_cities)}"
                )
                results.append({
                    "route_id": route_id,
                    "carretera": road_code,
                    "overlap_description": description,
                })

    logger.info(f"  Detected {len(results)} route-corridor overlaps")
    return results


def run() -> int:
    """Download TITSA GTFS data, compute aggregates, and store in database.

    Returns the total count of records processed.
    """
    http_session = create_http_session()

    # Step 1: Download and extract GTFS ZIP
    zip_path = _download_gtfs_zip(http_session)
    if not zip_path:
        logger.warning("Could not obtain GTFS ZIP. Keeping existing data.")
        return 0

    gtfs_dir = _extract_gtfs_zip(zip_path)
    if not gtfs_dir:
        logger.warning("Could not extract GTFS ZIP. Keeping existing data.")
        return 0

    # Step 2: Read GTFS files
    stops = _read_csv(gtfs_dir, "stops.txt")
    routes = _read_csv(gtfs_dir, "routes.txt")
    trips = _read_csv(gtfs_dir, "trips.txt")
    stop_times = _read_csv(gtfs_dir, "stop_times.txt")
    calendar_dates = _read_csv(gtfs_dir, "calendar_dates.txt")

    if not stops or not routes:
        logger.warning("Missing essential GTFS files (stops/routes). Aborting.")
        return 0

    # Step 3: Find typical weekday services
    active_services = _find_typical_weekday_services(calendar_dates)

    # Step 4: Compute stop frequencies
    frequencies = {}
    if active_services and trips and stop_times:
        frequencies = _compute_stop_frequencies(active_services, trips, stop_times)

    # Step 5: Detect route corridors
    corridor_overlaps = _detect_route_corridors(routes)

    # Step 6: Store everything in the database
    db_session = get_session()
    count = 0

    try:
        # --- Upsert stops ---
        for stop in stops:
            stop_id = stop.get("stop_id", "").strip()
            if not stop_id:
                continue

            existing = db_session.query(ParadaGuagua).filter_by(stop_id=stop_id).first()
            if existing:
                existing.name = stop.get("stop_name", "")
                existing.lat = float(stop.get("stop_lat", 0) or 0)
                existing.lon = float(stop.get("stop_lon", 0) or 0)
            else:
                db_session.add(ParadaGuagua(
                    stop_id=stop_id,
                    name=stop.get("stop_name", ""),
                    lat=float(stop.get("stop_lat", 0) or 0),
                    lon=float(stop.get("stop_lon", 0) or 0),
                ))
            count += 1

        db_session.flush()
        logger.info(f"  Upserted {len(stops)} bus stops")

        # --- Upsert routes ---
        for route in routes:
            route_id = route.get("route_id", "").strip()
            if not route_id:
                continue

            existing = db_session.query(RutaGuagua).filter_by(route_id=route_id).first()
            if existing:
                existing.short_name = route.get("route_short_name", "")
                existing.long_name = route.get("route_long_name", "")
                existing.color = route.get("route_color", "")
            else:
                db_session.add(RutaGuagua(
                    route_id=route_id,
                    short_name=route.get("route_short_name", ""),
                    long_name=route.get("route_long_name", ""),
                    color=route.get("route_color", ""),
                ))
            count += 1

        db_session.flush()
        logger.info(f"  Upserted {len(routes)} bus routes")

        # --- Upsert stop frequencies ---
        for stop_id, freq in frequencies.items():
            existing = db_session.query(FrecuenciaParada).filter_by(stop_id=stop_id).first()
            if existing:
                existing.buses_dia = freq["buses_dia"]
                existing.rutas_count = freq["rutas_count"]
            else:
                db_session.add(FrecuenciaParada(
                    stop_id=stop_id,
                    buses_dia=freq["buses_dia"],
                    rutas_count=freq["rutas_count"],
                ))
            count += 1

        db_session.flush()
        logger.info(f"  Upserted {len(frequencies)} stop frequency records")

        # --- Upsert route corridor overlaps ---
        # Clear existing and re-insert (simpler than complex upsert for composite key)
        db_session.query(RutaTramo).delete()
        for overlap in corridor_overlaps:
            db_session.add(RutaTramo(
                route_id=overlap["route_id"],
                carretera=overlap["carretera"],
                overlap_description=overlap["overlap_description"],
            ))
            count += 1

        db_session.commit()
        logger.info(
            f"Transporte publico pipeline completed: {count} records processed "
            f"({len(stops)} stops, {len(routes)} routes, "
            f"{len(frequencies)} frequencies, {len(corridor_overlaps)} corridor overlaps)"
        )
    except Exception as e:
        db_session.rollback()
        logger.error(f"Error in transporte_publico pipeline: {e}", exc_info=True)
        raise
    finally:
        db_session.close()

    return count
