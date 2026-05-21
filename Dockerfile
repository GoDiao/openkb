# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS web
WORKDIR /build
COPY web/package.json web/package-lock.json* ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM python:3.12-slim AS runtime
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock README.md ./
COPY server/ ./server/
COPY workspace/ ./workspace/
COPY agent/ ./agent/
COPY skill/ ./skill/
COPY --from=web /build/dist ./web/dist

ENV OPENKB_ROOT=/app
ENV UV_CACHE_DIR=/app/.uv-cache

RUN uv sync --frozen

EXPOSE 8788

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://127.0.0.1:8788/api/health || exit 1

CMD ["uv", "run", "openkb", "serve", "--host", "0.0.0.0", "--port", "8788"]
