# Production deployment

OpenKB 1.0 ships as a **Python API + static React Hub**. One process can serve both.

## Option A — Local / LAN (recommended)

```bash
cd /path/to/OpenKB
uv sync
cd web && npm ci && npm run build
uv run openkb serve --port 8788 --host 127.0.0.1
```

Open `http://127.0.0.1:8788`. When `web/dist` exists, FastAPI mounts it at `/`.

For LAN access:

```bash
uv run openkb serve --port 8788 --host 0.0.0.0
```

Put TLS + auth in front (nginx, Caddy) — see [SECURITY.md](../SECURITY.md).

## Option B — Docker Compose

```bash
docker compose up --build -d
```

- Image: multi-stage build (Node builds UI, Python runs API)
- Volume: `./workspace` → persist projects
- Health: `GET /api/health`

## Environment

| Variable | Production |
|----------|------------|
| `OPENKB_ROOT` | Set automatically in Docker; else absolute repo path |
| `OPENKB_AGENT_ID` | Required for agents using CLI on the host |
| `UV_CACHE_DIR` | Optional cache location |

## What is *not* in the container

Business git repos (`repo_path`) stay on the host. Mount or clone them where `project.yaml` points.

## CI reference

GitHub Actions runs `pytest`, `npm run build`, and Playwright E2E — see `.github/workflows/ci.yml`.
