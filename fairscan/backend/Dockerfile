# syntax=docker/dockerfile:1.6
FROM python:3.11-slim AS runtime

# Faster, smaller, more predictable Python in containers.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# scikit-learn / fairlearn need libgomp at runtime. Everything else is wheels.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first so they cache across source edits.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Now the source.
COPY . .

# Drop privileges.
RUN useradd --create-home --uid 1001 appuser \
    && chown -R appuser:appuser /app
USER appuser

# Cloud Run injects $PORT; default locally to 8080. EXPOSE is documentation only.
ENV PORT=8080
EXPOSE 8080

# Shell form so $PORT expands at container start.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
