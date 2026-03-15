# TF Mobility

Observatorio de Movilidad de Tenerife - Transparency platform for mobility and infrastructure data in Tenerife.

## Project Structure

```
tf-mobility/
├── frontend/    # React + Vite + TypeScript + Tailwind CSS
├── backend/     # FastAPI + SQLAlchemy + SQLite
├── etl/         # Python ETL pipelines for data collection
├── nginx/       # Nginx reverse proxy configuration
└── docker-compose.yml
```

## Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### ETL
```bash
cd etl
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Docker
```bash
docker-compose up --build
```

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Recharts, Leaflet
- **Backend**: FastAPI, SQLAlchemy, SQLite, Pydantic v2
- **ETL**: Python, Requests, BeautifulSoup4, lxml
- **Infrastructure**: Docker, Nginx, Docker Compose
