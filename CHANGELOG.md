# Changelog

All notable changes to OpenKB are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-05-20

First release aimed at **single-user / trusted-network** Agent project hubs.

### Highlights (what you get)

1. **Agent CLI workflow** — `context`, `checkout`, `done`, `state set`, `roadmap`, `task create/delete`, and `doc verify` keep Kanban, STATE, roadmap, and session logs aligned without hand-editing board files.
2. **Project Hub (Web UI)** — Overview, Kanban, Spec, Plan, interactive Roadmap graph, and Decisions (ADR) in English and 中文.
3. **Live sync (WebSocket V2)** — Hub subscribes to `/api/projects/{slug}/watch`; CLI/API changes push updates immediately, with ~2s polling fallback when disconnected.
4. **Spec / Plan from business repos** — Hub reads Markdown via `project.yaml` pointers; agents write in `{repo_path}` and verify with `doc verify`.
5. **Roadmap + ADR traceability** — `roadmap.yaml` drives the graph; optional ADR frontmatter `phases: [p7]` links decisions to phases.
6. **Multi-agent locks** — Checkout locks visible in UI; conflict returns HTTP 409 / CLI exit 2.
7. **Onboarding** — Help page, `openkb-sync` skill, agent AGENTS.md patch, and in-app checklist for new projects.
8. **Quality bar** — 79+ pytest tests, Playwright E2E (isolated `e2e-sandbox` project), GitHub Actions CI.

### Added

- `openkb serve --host` for Docker/LAN binding
- `openkb task delete` and `DELETE /api/projects/{slug}/tasks/{id}`
- Production Docker image (`Dockerfile`, `docker-compose.yml`)
- `SECURITY.md`, `UPGRADE.md`, CI workflow

### Known limitations (v1.0)

- **No authentication** — intended for localhost or private networks only
- **Kanban drag ≠ `openkb done`** — UI drag moves cards only; agents must use CLI to update STATE/session/roadmap
- **File-based storage** — `workspace/projects/{slug}/`; not optimized for large teams or high concurrency

### Windows notes

- Prefer **`uv run openkb`** (works cross-platform; avoids PowerShell-only scripts)
- Set **`UV_CACHE_DIR`** and **`PLAYWRIGHT_BROWSERS_PATH`** on a non-system drive if C: is tight (e.g. `E:\uv-cache`, `E:\playwright-browsers`)
- CLI UTF-8 output fixed for GBK consoles (`cli_echo` + `ensure_stdio_utf8`)

### Upgrade

See [UPGRADE.md](UPGRADE.md) if you used pre-1.0 snapshots or 0.1.0 installs.

[1.0.0]: https://github.com/GoDiao/openkb/releases/tag/v1.0.0
