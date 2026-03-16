"""Pipeline: Fetch public contracts from PLACSP (Plataforma de Contratacion del Sector Publico).

Real data source:
- PLACSP ATOM/XML feeds: https://contrataciondelsectorpublico.gob.es/
- Monthly and annual ZIP files containing XML entries for all published contracts.
- Filtered by Cabildo Insular de Tenerife (NIF: P3800001D).

Contract data includes licitaciones (tenders) and adjudicaciones (awards).
"""

import logging
import os
import re
import sys
import tempfile
import zipfile
from datetime import date, datetime
from io import BytesIO
from typing import Optional

from lxml import etree

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_session, Contrato, Empresa
from utils import create_http_session, download_file

logger = logging.getLogger(__name__)

# PLACSP feed URL templates
PLACSP_ANNUAL_ZIP_URL = (
    "https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643"
    "/licitacionesPerfilesContratanteCompleto3_{year}.zip"
)
PLACSP_MONTHLY_ZIP_URL = (
    "https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643"
    "/licitacionesPerfilesContratanteCompleto3_{yearmonth}.zip"
)

# Cabildo Insular de Tenerife identification
CABILDO_TENERIFE_NIF = "P3800001D"
CABILDO_TENERIFE_NAME_PATTERNS = ["cabildo", "tenerife"]

# Monthly ZIPs to fetch on initial load (YYYYMM format)
# Monthly ZIPs are ~120MB vs ~1.6GB for annual — much faster to download/process.
# Full historical load: 10 years of monthly data (~120 months).
# After initial load, scheduled runs only fetch the current month.
HISTORY_YEARS = 10

def _get_initial_months() -> list[str]:
    """Generate YYYYMM strings for the last 10 years of monthly data."""
    months = []
    now = datetime.now()
    for year in range(now.year - HISTORY_YEARS, now.year + 1):
        end_month = now.month if year == now.year else 12
        for month in range(1, end_month + 1):
            months.append(f"{year}{month:02d}")
    return months


def _get_update_months() -> list[str]:
    """Generate YYYYMM strings for just the current and previous month (for scheduled runs)."""
    now = datetime.now()
    current = now.strftime("%Y%m")
    # Also include previous month in case it was updated late
    if now.month == 1:
        previous = f"{now.year - 1}12"
    else:
        previous = f"{now.year}{now.month - 1:02d}"
    return [previous, current]

# XML namespaces used in PLACSP feeds
NAMESPACES = {
    "atom": "http://www.w3.org/2005/Atom",
    "cbc": "urn:dgpe:names:draft:codice:schema:xsd:CommonBasicComponents-2",
    "cac": "urn:dgpe:names:draft:codice:schema:xsd:CommonAggregateComponents-2",
    "cbc-place-ext": "urn:dgpe:names:draft:codice-place-ext:schema:xsd:CommonBasicComponents-2",
    "cac-place-ext": "urn:dgpe:names:draft:codice-place-ext:schema:xsd:CommonAggregateComponents-2",
}

# Regex to extract TF-XX road codes from contract descriptions
ROAD_CODE_PATTERN = re.compile(r"TF-\d+", re.IGNORECASE)

# Map PLACSP status codes to our internal status values
STATUS_MAP = {
    "PUB": "publicado",
    "EV": "en_evaluacion",
    "PRE": "preadjudicado",
    "ADJ": "adjudicado",
    "RES": "resuelto",
    "DES": "desierto",
    "ANUL": "anulado",
    "ANU": "anulado",
}

# Map PLACSP type codes to our internal type values
TYPE_MAP = {
    "1": "obras",
    "2": "servicios",
    "3": "suministros",
    "21": "servicios",
    "31": "mixto",
}


def _text(element, xpath: str, namespaces: dict = NAMESPACES) -> Optional[str]:
    """Safely extract text from an XML element using XPath."""
    try:
        result = element.xpath(xpath, namespaces=namespaces)
        if result:
            if isinstance(result[0], str):
                return result[0].strip() or None
            text = result[0].text
            return text.strip() if text else None
    except Exception:
        pass
    return None


def _float_val(element, xpath: str) -> Optional[float]:
    """Safely extract a float value from an XML element."""
    text = _text(element, xpath)
    if text:
        try:
            # Remove currency symbols, spaces, and commas
            cleaned = text.replace(",", ".").replace(" ", "").replace("€", "")
            return float(cleaned)
        except (ValueError, TypeError):
            pass
    return None


def _parse_date(date_str: Optional[str]) -> Optional[date]:
    """Parse a date string from PLACSP XML (various formats)."""
    if not date_str:
        return None
    date_str = date_str.strip()
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y"):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None


def _is_cabildo_tenerife(entry) -> bool:
    """Check if an XML entry belongs to Cabildo Insular de Tenerife.

    Checks both the NIF identification and the party name.
    """
    # Check by NIF
    nif = _text(
        entry,
        ".//cac-place-ext:LocatedContractingParty/cac:Party"
        "/cac:PartyIdentification/cbc:ID"
    )
    if nif and nif.strip().upper() == CABILDO_TENERIFE_NIF:
        return True

    # Fallback: check by name
    party_name = _text(
        entry,
        ".//cac-place-ext:LocatedContractingParty/cac:Party"
        "/cac:PartyName/cbc:Name"
    )
    if party_name:
        name_lower = party_name.lower()
        if all(pattern in name_lower for pattern in CABILDO_TENERIFE_NAME_PATTERNS):
            return True

    return False


def _extract_road_code(text: Optional[str]) -> Optional[str]:
    """Extract the first TF-XX road code from a text string."""
    if not text:
        return None
    match = ROAD_CODE_PATTERN.search(text)
    return match.group(0).upper() if match else None


def _parse_contract_entry(entry) -> Optional[dict]:
    """Parse a single ATOM entry into a contract dict.

    Extracts data from cac-place-ext:ContractFolderStatus within the entry.
    """
    # Find ContractFolderStatus — the main data container
    cfs = entry.find(
        ".//cac-place-ext:ContractFolderStatus",
        namespaces=NAMESPACES,
    )
    if cfs is None:
        # Try directly under entry
        cfs = entry

    # Expediente (contract folder ID)
    expediente = _text(cfs, "cbc-place-ext:ContractFolderID")
    if not expediente:
        expediente = _text(cfs, "cbc:ContractFolderID")
    if not expediente:
        return None

    # Status code
    status_code = _text(cfs, "cbc-place-ext:ContractFolderStatusCode")
    if not status_code:
        status_code = _text(cfs, "cbc:ContractFolderStatusCode")
    estado = STATUS_MAP.get(status_code, status_code or "desconocido")

    # Procurement project details
    pp_base = "cac:ProcurementProject"

    objeto = _text(cfs, f"{pp_base}/cbc:Name")
    if not objeto:
        # Try ATOM title as fallback
        objeto = _text(entry, "atom:title")

    tipo_code = _text(cfs, f"{pp_base}/cbc:TypeCode")
    tipo = TYPE_MAP.get(tipo_code, tipo_code or "otros")

    # Budget amount
    importe_licitacion = _float_val(
        cfs, f"{pp_base}/cac:BudgetAmount/cbc:TotalAmount"
    )
    if importe_licitacion is None:
        importe_licitacion = _float_val(
            cfs, f"{pp_base}/cac:BudgetAmount/cbc:TaxExclusiveAmount"
        )

    # Tender result (award)
    tr_base = "cac:TenderResult"
    fecha_adj_str = _text(cfs, f"{tr_base}/cbc:AwardDate")
    fecha_adjudicacion = _parse_date(fecha_adj_str)

    importe_adjudicacion = _float_val(cfs, f"{tr_base}/cbc:AwardAmount")

    # Winner
    adjudicatario = _text(
        cfs, f"{tr_base}/cac:WinningParty/cac:PartyName/cbc:Name"
    )

    # Duration / planned period
    plazo = _text(cfs, f"{pp_base}/cac:PlannedPeriod/cbc:DurationMeasure")

    # Publication date from ATOM entry
    pub_date_str = _text(entry, "atom:updated") or _text(entry, "atom:published")
    fecha_publicacion = _parse_date(pub_date_str)

    # Road code extraction from title/description
    carretera = _extract_road_code(objeto)

    # Also check location for road code if not found in title
    if not carretera:
        location_text = _text(cfs, f"{pp_base}/cac:RealizedLocation/cbc:Description")
        carretera = _extract_road_code(location_text)

    # Source URL from ATOM link
    url_fuente = None
    link_elem = entry.find("atom:link[@rel='alternate']", namespaces=NAMESPACES)
    if link_elem is not None:
        url_fuente = link_elem.get("href")
    if not url_fuente:
        link_elem = entry.find("atom:link", namespaces=NAMESPACES)
        if link_elem is not None:
            url_fuente = link_elem.get("href")
    if not url_fuente:
        url_fuente = "https://contrataciondelsectorpublico.gob.es"

    return {
        "expediente": expediente.strip(),
        "objeto": objeto,
        "tipo": tipo,
        "organo_contratacion": "Cabildo Insular de Tenerife",
        "importe_licitacion": importe_licitacion,
        "importe_adjudicacion": importe_adjudicacion,
        "adjudicatario": adjudicatario,
        "fecha_publicacion": fecha_publicacion,
        "fecha_adjudicacion": fecha_adjudicacion,
        "plazo": plazo,
        "estado": estado,
        "carretera": carretera,
        "url_fuente": url_fuente,
    }


def _process_xml_content(xml_bytes: bytes) -> list[dict]:
    """Parse an XML file content and extract Cabildo de Tenerife contracts.

    Uses iterparse for memory efficiency on large files.
    """
    contracts = []
    try:
        # Use iterparse for memory-efficient processing of large XML files
        context = etree.iterparse(
            BytesIO(xml_bytes),
            events=("end",),
            tag="{http://www.w3.org/2005/Atom}entry",
            recover=True,
        )

        for event, entry in context:
            try:
                if _is_cabildo_tenerife(entry):
                    contract = _parse_contract_entry(entry)
                    if contract:
                        contracts.append(contract)
            except Exception as e:
                logger.debug(f"Error parsing entry: {e}")
            finally:
                # Free memory — critical for large files
                entry.clear()
                while entry.getprevious() is not None:
                    del entry.getparent()[0]

    except etree.XMLSyntaxError as e:
        logger.warning(f"XML syntax error (attempting recovery): {e}")
        # Try full parse as fallback for smaller/simpler files
        try:
            parser = etree.XMLParser(recover=True, huge_tree=True)
            tree = etree.parse(BytesIO(xml_bytes), parser)
            root = tree.getroot()
            entries = root.findall(".//atom:entry", namespaces=NAMESPACES)
            for entry in entries:
                try:
                    if _is_cabildo_tenerife(entry):
                        contract = _parse_contract_entry(entry)
                        if contract:
                            contracts.append(contract)
                except Exception as e:
                    logger.debug(f"Error parsing entry in fallback: {e}")
        except Exception as e2:
            logger.error(f"Failed to parse XML even with recovery: {e2}")

    except Exception as e:
        logger.error(f"Unexpected error processing XML: {e}")

    return contracts


def _process_zip_file(zip_path: str) -> list[dict]:
    """Process a downloaded PLACSP ZIP file, extracting all contracts.

    Each ZIP contains one or more XML files with ATOM feed entries.
    """
    all_contracts = []
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            xml_files = [f for f in zf.namelist() if f.lower().endswith((".xml", ".atom"))]
            logger.info(f"  ZIP contains {len(xml_files)} XML file(s)")

            for xml_name in xml_files:
                logger.info(f"  Processing XML: {xml_name}")
                try:
                    xml_bytes = zf.read(xml_name)
                    contracts = _process_xml_content(xml_bytes)
                    all_contracts.extend(contracts)
                    logger.info(f"    Found {len(contracts)} Cabildo de Tenerife contracts")
                except Exception as e:
                    logger.error(f"    Error processing {xml_name}: {e}")

    except zipfile.BadZipFile:
        logger.error(f"Bad ZIP file: {zip_path}")
    except Exception as e:
        logger.error(f"Error opening ZIP {zip_path}: {e}")

    return all_contracts


def _download_and_process_zip(url: str, http_session) -> list[dict]:
    """Download a PLACSP ZIP file to /tmp, process it, and clean up."""
    # Create temp file
    fd, tmp_path = tempfile.mkstemp(suffix=".zip", prefix="placsp_")
    os.close(fd)

    try:
        success = download_file(url, tmp_path, session=http_session, timeout=(10, 600))
        if not success:
            logger.warning(f"Failed to download: {url}")
            return []

        contracts = _process_zip_file(tmp_path)
        return contracts
    finally:
        # Always clean up temp file
        try:
            os.unlink(tmp_path)
            logger.debug(f"Cleaned up temp file: {tmp_path}")
        except OSError:
            pass


def _build_company_stats(session):
    """Build/update the empresas table from contracts data."""
    from sqlalchemy import func

    results = (
        session.query(
            Contrato.adjudicatario,
            func.count(Contrato.id).label("num"),
            func.sum(Contrato.importe_adjudicacion).label("total"),
        )
        .filter(Contrato.adjudicatario.isnot(None))
        .filter(Contrato.adjudicatario != "")
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


def run() -> int:
    """Fetch real contracts from PLACSP and upsert into database.

    Strategy:
    - If DB is empty: full historical load (last 10 years, monthly ZIPs).
    - If DB has data: incremental update (last 2 months only).
    - Parse ATOM/XML, filter for Cabildo de Tenerife entries.
    - Upsert into database (preserving existing data on failure).
    - Update company statistics.

    Returns the count of records processed.
    """
    http_session = create_http_session()
    all_contracts = []

    # Decide: initial load vs incremental update
    db_check = get_session()
    existing_count = db_check.query(Contrato).count()
    db_check.close()

    if existing_count > 0:
        months_to_fetch = _get_update_months()
        logger.info(
            f"Incremental update mode: {existing_count} contracts already in DB, "
            f"fetching {len(months_to_fetch)} recent months"
        )
    else:
        months_to_fetch = _get_initial_months()
        logger.info(
            f"Initial load mode: empty DB, fetching {len(months_to_fetch)} months "
            f"({HISTORY_YEARS} years of history)"
        )

    for yearmonth in months_to_fetch:
        url = PLACSP_MONTHLY_ZIP_URL.format(yearmonth=yearmonth)
        logger.info(f"Processing PLACSP monthly feed: {yearmonth}")
        contracts = _download_and_process_zip(url, http_session)
        if contracts:
            all_contracts.extend(contracts)
            logger.info(f"  Month {yearmonth}: {len(contracts)} contracts found")
        else:
            logger.info(f"  Month {yearmonth}: no contracts found or download failed")

    if not all_contracts:
        logger.warning(
            "No contracts fetched from PLACSP feeds. "
            "Keeping existing data in database (fallback: no delete)."
        )
        return 0

    # Deduplicate by expediente (keep the most recent version)
    seen = {}
    for contract in all_contracts:
        exp = contract["expediente"]
        # Later entries overwrite earlier ones (more recent status)
        seen[exp] = contract

    unique_contracts = list(seen.values())
    logger.info(
        f"Total unique contracts after deduplication: {len(unique_contracts)} "
        f"(from {len(all_contracts)} raw entries)"
    )

    # Upsert into database
    db_session = get_session()
    count = 0

    try:
        for contract_data in unique_contracts:
            existing = db_session.query(Contrato).filter_by(
                expediente=contract_data["expediente"]
            ).first()

            if existing:
                for key, value in contract_data.items():
                    if value is not None:  # Don't overwrite with None
                        setattr(existing, key, value)
                logger.debug(f"Updated contract: {contract_data['expediente']}")
            else:
                contrato = Contrato(**contract_data)
                db_session.add(contrato)
                logger.debug(f"Added contract: {contract_data['expediente']}")

            count += 1

        db_session.commit()

        # Build company rankings from contracts
        _build_company_stats(db_session)

        logger.info(f"Contratos pipeline completed: {count} contracts upserted from PLACSP")
    except Exception as e:
        db_session.rollback()
        logger.error(f"Error in contratos pipeline: {e}", exc_info=True)
        raise
    finally:
        db_session.close()

    return count
