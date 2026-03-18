# TF Mobility

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

**Citizen Transparency Observatory for Mobility and Infrastructure in Tenerife**

---

## Introduction

TF Mobility is an independent citizen transparency platform that collects, processes, and visualizes public data about mobility and infrastructure in Tenerife, Canary Islands. It aims to make government data accessible and understandable to citizens by aggregating information from official sources into a single, easy-to-navigate dashboard.

The platform covers traffic intensity, public transportation analysis, government contract transparency, tourism statistics, and infrastructure projects. All data is sourced from publicly available government datasets and processed through automated ETL pipelines.

This is an independent citizen initiative with no political affiliation. Its sole purpose is to promote transparency and informed public discourse about mobility decisions on the island.

## Data Notice

> **Warning**
> The processed data (SQLite database and ETL cache files) is **not included** in this repository. To populate the database, you must run the ETL pipelines. See the [Getting Started](#getting-started) section for instructions.

## Features

- **Traffic Intensity** — Interactive maps and charts showing real-time and historical traffic data across Tenerife
- **Public Transit Analysis** — Comprehensive study of bus (TITSA), tram (Tranvía), taxi, and VTC services
- **Contract Transparency** — Government contracts database with company details, award amounts, and related entities
- **Tourism Statistics** — Visitor data and its relationship to mobility infrastructure
- **Government Promises Tracker** — Monitoring of official commitments related to mobility projects
- **Alternatives Comparison** — Analysis comparing proposed infrastructure solutions

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, Recharts, Leaflet |
| **Backend** | FastAPI, SQLAlchemy, SQLite, Pydantic v2 |
| **ETL** | Python, Requests, BeautifulSoup4, lxml |
| **Infrastructure** | Docker, Nginx, Docker Compose |

## Project Structure

```
tf-mobility/
├── frontend/          # React + Vite + TypeScript + Tailwind CSS
├── backend/           # FastAPI + SQLAlchemy + SQLite
├── etl/               # Python ETL pipelines for data collection
├── nginx/             # Nginx reverse proxy configuration
├── ssl/               # SSL certificate configuration
└── docker-compose.yml
```

## Getting Started

### Docker (recommended)

The easiest way to run the full stack:

```bash
docker-compose up --build
```

This starts the frontend, backend, ETL pipelines, and Nginx reverse proxy. The ETL service will automatically begin collecting and processing data into the SQLite database.

### Individual Services

For development, you can run each service independently:

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**ETL:**
```bash
cd etl
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request.
