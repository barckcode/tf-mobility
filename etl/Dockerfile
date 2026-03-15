FROM python:3.12-slim

WORKDIR /app

# Install dependencies first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY *.py ./
COPY pipelines/ ./pipelines/

# Create data directory for SQLite
RUN mkdir -p /app/data

CMD ["python", "main.py"]
