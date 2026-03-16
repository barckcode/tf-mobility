"""Shared HTTP client with retries, logging, and error handling for ETL pipelines."""

import logging
import time
from typing import Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

# Default timeout for HTTP requests (connect, read) in seconds
DEFAULT_TIMEOUT = (10, 60)

# Default retry configuration
DEFAULT_RETRIES = 3
DEFAULT_BACKOFF_FACTOR = 1.0
RETRY_STATUS_CODES = (429, 500, 502, 503, 504)


def create_http_session(
    retries: int = DEFAULT_RETRIES,
    backoff_factor: float = DEFAULT_BACKOFF_FACTOR,
    status_forcelist: tuple = RETRY_STATUS_CODES,
) -> requests.Session:
    """Create a requests.Session with automatic retry logic.

    Args:
        retries: Number of retry attempts for failed requests.
        backoff_factor: Multiplier for exponential backoff between retries.
        status_forcelist: HTTP status codes that trigger a retry.

    Returns:
        A configured requests.Session instance.
    """
    session = requests.Session()
    retry_strategy = Retry(
        total=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
        allowed_methods=["GET", "HEAD"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({
        "User-Agent": "TF-Mobility-ETL/1.0 (Citizen Transparency Observatory)",
        "Accept": "application/json",
    })
    return session


def fetch_json(
    url: str,
    params: Optional[dict] = None,
    session: Optional[requests.Session] = None,
    timeout: tuple = DEFAULT_TIMEOUT,
) -> Optional[dict]:
    """Fetch JSON data from a URL with error handling.

    Args:
        url: The URL to fetch.
        params: Optional query parameters.
        session: Optional pre-configured session. Creates one if not provided.
        timeout: Tuple of (connect_timeout, read_timeout) in seconds.

    Returns:
        Parsed JSON as dict/list, or None if the request failed.
    """
    _session = session or create_http_session()
    try:
        logger.info(f"Fetching: {url}")
        if params:
            logger.debug(f"  Params: {params}")
        response = _session.get(url, params=params, timeout=timeout)
        response.raise_for_status()
        data = response.json()
        logger.info(f"  Success: HTTP {response.status_code}, content length={len(response.content)}")
        return data
    except requests.exceptions.HTTPError as e:
        logger.error(f"  HTTP error fetching {url}: {e} (status={e.response.status_code if e.response else 'N/A'})")
        return None
    except requests.exceptions.ConnectionError as e:
        logger.error(f"  Connection error fetching {url}: {e}")
        return None
    except requests.exceptions.Timeout as e:
        logger.error(f"  Timeout fetching {url}: {e}")
        return None
    except requests.exceptions.JSONDecodeError as e:
        logger.error(f"  JSON decode error for {url}: {e}")
        return None
    except Exception as e:
        logger.error(f"  Unexpected error fetching {url}: {e}")
        return None


def download_file(
    url: str,
    dest_path: str,
    session: Optional[requests.Session] = None,
    timeout: tuple = (10, 300),
    chunk_size: int = 8192,
) -> bool:
    """Download a file using streaming/chunked transfer.

    Args:
        url: The URL to download.
        dest_path: Local filesystem path to save the file.
        session: Optional pre-configured session.
        timeout: Tuple of (connect_timeout, read_timeout) in seconds.
        chunk_size: Size of chunks for streaming download.

    Returns:
        True if download succeeded, False otherwise.
    """
    _session = session or create_http_session()
    try:
        logger.info(f"Downloading: {url} -> {dest_path}")
        response = _session.get(url, stream=True, timeout=timeout)
        response.raise_for_status()

        total_size = int(response.headers.get("content-length", 0))
        downloaded = 0

        with open(dest_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)

        if total_size > 0:
            logger.info(f"  Downloaded {downloaded:,} bytes ({downloaded / 1024 / 1024:.1f} MB)")
        else:
            logger.info(f"  Downloaded {downloaded:,} bytes")
        return True
    except requests.exceptions.HTTPError as e:
        logger.error(f"  HTTP error downloading {url}: {e}")
        return False
    except requests.exceptions.ConnectionError as e:
        logger.error(f"  Connection error downloading {url}: {e}")
        return False
    except requests.exceptions.Timeout as e:
        logger.error(f"  Timeout downloading {url}: {e}")
        return False
    except IOError as e:
        logger.error(f"  IO error saving to {dest_path}: {e}")
        return False
    except Exception as e:
        logger.error(f"  Unexpected error downloading {url}: {e}")
        return False
