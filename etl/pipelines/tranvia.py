"""Pipeline: Parse Metropolitano de Tenerife GTFS data and compute tram stop frequencies.

Real data source:
- Metrotenerife GTFS feed (official tram operator).
- ZIP contains: stops.txt, routes.txt, trips.txt, stop_times.txt, calendar.txt, frequencies.txt
- URL: https://metrotenerife.com/transit/google_transit.zip

Processing:
1. Download GTFS ZIP (cached locally to avoid re-downloads).
2. Parse stops.txt -> ParadaTranvia (tram stops with coordinates).
3. Parse routes.txt -> RutaTranvia (tram routes with names/colors).
4. Compute FrecuenciaTranvia: trams/day per stop on a typical weekday.
   Uses calendar.txt to identify weekday services and frequencies.txt
   (headway-based scheduling) to compute actual trip counts per day.
"""

import csv
import logging
import math
import os
import sys
import zipfile
from collections import defaultdict
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_session, init_db, ParadaTranvia, RutaTranvia, FrecuenciaTranvia
from utils import create_http_session, download_file

logger = logging.getLogger(__name__)

# GTFS ZIP download URL from Metrotenerife
GTFS_ZIP_URL = "https://metrotenerife.com/transit/google_transit.zip"

# Local cache directory
CACHE_DIR = os.path.join(
    os.environ.get("ETL_CACHE_DIR", "/app/cache"),
    "tranvia",
)

GTFS_ZIP_FILENAME = "tranvia_gtfs.zip"
GTFS_EXTRACT_DIR = "tranvia_gtfs"

# Minimum valid ZIP size (to detect error pages).
# Tram GTFS is small (~5KB) since the network only has 2 lines.
MIN_ZIP_SIZE = 2_000


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


def _parse_time_seconds(time_str: str) -> int:
    """Parse a GTFS time string (HH:MM:SS) into seconds since midnight."""
    parts = time_str.strip().split(":")
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    return 0


def _find_weekday_services(calendar: list[dict]) -> set[str]:
    """Find service_ids active on weekdays using calendar.txt.

    Looks for services where monday=1 (typical weekday pattern).
    Falls back to any service with at least one weekday active.
    """
    weekday_services = set()
    any_weekday_services = set()

    today = datetime.now()
    today_str = today.strftime("%Y%m%d")

    for row in calendar:
        service_id = row.get("service_id", "").strip()
        if not service_id:
            continue

        # Check date validity
        start_date = row.get("start_date", "")
        end_date = row.get("end_date", "")

        # If dates are provided, check they encompass today or a future period
        date_valid = True
        if end_date and end_date < today_str:
            # Service ended in the past — still use it as fallback
            date_valid = False

        monday = row.get("monday", "0") == "1"
        tuesday = row.get("tuesday", "0") == "1"
        wednesday = row.get("wednesday", "0") == "1"
        thursday = row.get("thursday", "0") == "1"
        friday = row.get("friday", "0") == "1"

        if monday:
            if date_valid:
                weekday_services.add(service_id)
            else:
                any_weekday_services.add(service_id)
        elif any([tuesday, wednesday, thursday, friday]):
            any_weekday_services.add(service_id)

    if weekday_services:
        logger.info(f"  Found {len(weekday_services)} weekday services (from calendar.txt): {weekday_services}")
        return weekday_services

    if any_weekday_services:
        logger.warning(
            f"No current weekday services found, using {len(any_weekday_services)} "
            f"past/fallback weekday services: {any_weekday_services}"
        )
        return any_weekday_services

    logger.warning("No weekday services found in calendar.txt")
    return set()


def _compute_stop_frequencies(
    active_services: set[str],
    trips: list[dict],
    stop_times: list[dict],
    frequencies: list[dict],
) -> dict[str, dict]:
    """Compute trams/day and route count per stop for active services.

    Uses frequencies.txt (headway-based scheduling) to compute the actual
    number of tram departures per day per trip. Each trip is repeated
    based on its frequency entries: for each time window, the number of
    departures is (end - start) / headway_secs.

    Returns: {stop_id: {"trams_dia": int, "rutas_count": int}}
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

    # Step 2: Compute how many times each trip runs per day using frequencies.txt
    trip_departures = defaultdict(int)
    if frequencies:
        for row in frequencies:
            trip_id = row.get("trip_id", "").strip()
            if trip_id not in active_trip_ids:
                continue

            start_secs = _parse_time_seconds(row.get("start_time", "0:0:0"))
            end_secs = _parse_time_seconds(row.get("end_time", "0:0:0"))
            headway_secs = int(row.get("headway_secs", "0") or "0")

            if headway_secs > 0 and end_secs > start_secs:
                departures = math.ceil((end_secs - start_secs) / headway_secs)
                trip_departures[trip_id] += departures

        logger.info(
            f"  Computed departures from frequencies.txt: "
            f"{dict(trip_departures)}"
        )
    else:
        # No frequencies.txt — each trip runs exactly once
        for trip_id in active_trip_ids:
            trip_departures[trip_id] = 1

    # Step 3: For each trip, find which stops it serves (from stop_times)
    trip_stops = defaultdict(set)
    for st in stop_times:
        trip_id = st.get("trip_id", "").strip()
        if trip_id in active_trip_ids:
            stop_id = st.get("stop_id", "").strip()
            if stop_id:
                trip_stops[trip_id].add(stop_id)

    # Step 4: Aggregate: for each stop, sum up departures across all trips serving it
    stop_tram_count = defaultdict(int)
    stop_routes = defaultdict(set)

    for trip_id, departures in trip_departures.items():
        route_id = trip_to_route.get(trip_id)
        for stop_id in trip_stops.get(trip_id, set()):
            stop_tram_count[stop_id] += departures
            if route_id:
                stop_routes[stop_id].add(route_id)

    # Build result
    result = {}
    for stop_id in set(stop_tram_count.keys()) | set(stop_routes.keys()):
        result[stop_id] = {
            "trams_dia": stop_tram_count.get(stop_id, 0),
            "rutas_count": len(stop_routes.get(stop_id, set())),
        }

    logger.info(f"  Computed frequencies for {len(result):,} stops")
    return result


def run() -> int:
    """Download Metrotenerife GTFS data, compute aggregates, and store in database.

    Returns the total count of records processed.
    """
    init_db()
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
    calendar = _read_csv(gtfs_dir, "calendar.txt")
    frequencies_data = _read_csv(gtfs_dir, "frequencies.txt")

    if not stops or not routes:
        logger.warning("Missing essential GTFS files (stops/routes). Aborting.")
        return 0

    # Step 3: Find typical weekday services using calendar.txt
    active_services = _find_weekday_services(calendar)

    # Step 4: Compute stop frequencies using frequencies.txt headway data
    frequencies = {}
    if active_services and trips and stop_times:
        frequencies = _compute_stop_frequencies(
            active_services, trips, stop_times, frequencies_data
        )

    # Step 5: Store everything in the database
    db_session = get_session()
    count = 0

    try:
        # --- Upsert stops ---
        for stop in stops:
            stop_id = stop.get("stop_id", "").strip()
            if not stop_id:
                continue

            existing = db_session.query(ParadaTranvia).filter_by(stop_id=stop_id).first()
            if existing:
                existing.name = stop.get("stop_name", "")
                existing.lat = float(stop.get("stop_lat", 0) or 0)
                existing.lon = float(stop.get("stop_lon", 0) or 0)
            else:
                db_session.add(ParadaTranvia(
                    stop_id=stop_id,
                    name=stop.get("stop_name", ""),
                    lat=float(stop.get("stop_lat", 0) or 0),
                    lon=float(stop.get("stop_lon", 0) or 0),
                ))
            count += 1

        db_session.flush()
        logger.info(f"  Upserted {len(stops)} tram stops")

        # --- Upsert routes ---
        for route in routes:
            route_id = route.get("route_id", "").strip()
            if not route_id:
                continue

            existing = db_session.query(RutaTranvia).filter_by(route_id=route_id).first()
            if existing:
                existing.short_name = route.get("route_short_name", "")
                existing.long_name = route.get("route_long_name", "")
                existing.color = route.get("route_color", "")
            else:
                db_session.add(RutaTranvia(
                    route_id=route_id,
                    short_name=route.get("route_short_name", ""),
                    long_name=route.get("route_long_name", ""),
                    color=route.get("route_color", ""),
                ))
            count += 1

        db_session.flush()
        logger.info(f"  Upserted {len(routes)} tram routes")

        # --- Upsert stop frequencies ---
        for stop_id, freq in frequencies.items():
            existing = db_session.query(FrecuenciaTranvia).filter_by(stop_id=stop_id).first()
            if existing:
                existing.trams_dia = freq["trams_dia"]
                existing.rutas_count = freq["rutas_count"]
            else:
                db_session.add(FrecuenciaTranvia(
                    stop_id=stop_id,
                    trams_dia=freq["trams_dia"],
                    rutas_count=freq["rutas_count"],
                ))
            count += 1

        db_session.flush()
        logger.info(f"  Upserted {len(frequencies)} stop frequency records")

        db_session.commit()
        logger.info(
            f"Tranvia pipeline completed: {count} records processed "
            f"({len(stops)} stops, {len(routes)} routes, "
            f"{len(frequencies)} frequencies)"
        )
    except Exception as e:
        db_session.rollback()
        logger.error(f"Error in tranvia pipeline: {e}", exc_info=True)
        raise
    finally:
        db_session.close()

    return count
