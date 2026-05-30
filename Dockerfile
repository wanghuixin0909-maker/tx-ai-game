FROM python:3.12-slim AS backend-builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./

RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim AS backend-production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /install /usr/local
COPY backend/ ./backend/

RUN mkdir -p /app/backend/data \
    && useradd -m -u 1000 appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

ENTRYPOINT ["tini", "--"]
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
