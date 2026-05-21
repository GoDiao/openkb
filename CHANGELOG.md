# Changelog

All notable changes to OpenKB are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2026-05-21

Hub UX polish, accessibility, performance, and open-source release hygiene.

### Added

- **Hub UX:** Design system refresh (8 themes, glass header, page transitions, skeleton loaders)
- **Onboarding:** Hub hero demo, checklist animations, copy-to-clipboard for CLI commands
- **Docs reader:** Spec/Plan TOC, scroll spy, read progress bar, mobile TOC drawer
- **Roadmap:** Hover highlights, done/active animations, lazy-loaded graph on Overview
- **Overview:** Animated progress ring, board bar chart, count-up metrics
- **Kanban:** Column empty states, drag polish, save feedback in task sidebar
- **Shortcuts:** Vim-style `g` + letter navigation, `Ctrl+/` help modal, Tab hover hints
- **Live sync UI:** Connection status badge, reconnect toasts, WebSocket status context
- **E2E:** `web/e2e/polish.spec.ts` (shortcuts, watch badge, overview charts)
- **Demo tooling:** `npm run demo:capture`, [docs/DEMO.md](docs/DEMO.md)
- **Open source docs:** [docs/WHY_OPENKB.md](docs/WHY_OPENKB.md), [docs/PUBLISHING.md](docs/PUBLISHING.md)
- **Community:** GitHub issue/PR templates, [GOOD_FIRST_ISSUES.md](.github/GOOD_FIRST_ISSUES.md)
- **Portable dogfood:** `repo_path: .` with relative path resolution (`path_utils`)

### Changed

- **Performance:** Code-split `RoadmapGraph` and `MermaidDiagram`; Overview roadmap lazy-mounts on scroll
- **Themes:** Chart tokens (`--chart-*`) with per-theme contrast tuning
- **Project nav:** Single watch-status badge; `aria-keyshortcuts` on tabs
- **Playwright browsers:** Default cache under `.playwright-browsers/` at repo root (configurable)

### Security

- Expanded [SECURITY.md](SECURITY.md) with public messaging — **no auth in v1.x**; do not expose `:8788` to the internet

### Upgrade from 1.0.0

```bash
git pull
uv sync --dev
cd web && npm ci && npm run build
# Restart openkb serve
```

If your dogfood `project.yaml` used an absolute `repo_path`, you may switch to `.` (relative to `OPENKB_ROOT`).

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

### Known limitations (v1.x)

- **No authentication** — intended for localhost or private networks only
- **Kanban drag ≠ `openkb done`** — UI drag moves cards only; agents must use CLI to update STATE/session/roadmap
- **File-based storage** — `workspace/projects/{slug}/`; not optimized for large teams or high concurrency

### Windows notes

- Prefer **`uv run openkb`** (works cross-platform; avoids PowerShell-only scripts)
- Set **`UV_CACHE_DIR`** and **`PLAYWRIGHT_BROWSERS_PATH`** on a non-system drive if C: is tight
- CLI UTF-8 output fixed for GBK consoles (`cli_echo` + `ensure_stdio_utf8`)

### Upgrade

See [UPGRADE.md](UPGRADE.md) if you used pre-1.0 snapshots or 0.1.0 installs.

[1.1.0]: https://github.com/GoDiao/openkb/releases/tag/v1.1.0
[1.0.0]: https://github.com/GoDiao/openkb/releases/tag/v1.0.0
