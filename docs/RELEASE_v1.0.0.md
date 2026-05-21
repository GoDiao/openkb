# OpenKB v1.0.0

Centralized **Agent Kanban + project state hub** for coding agents and humans.

## Highlights

1. **Agent CLI** — `context`, `checkout`, `done`, `state`, `roadmap`, `task`, `doc verify`
2. **Project Hub** — Overview, Kanban, Spec, Plan, interactive Roadmap graph, ADRs (EN/中文)
3. **Live sync** — WebSocket `/api/projects/{slug}/watch` + polling fallback
4. **Spec/Plan** from business repos via `project.yaml` pointers
5. **Roadmap + ADR** phase links (`phases: [p7]` frontmatter)
6. **Multi-agent locks** with UI visibility
7. **Onboarding** — Help, skill, agent patch, checklist
8. **CI** — pytest + Playwright E2E (`e2e-sandbox`)

## Quick start

```bash
uv sync --dev
cd web && npm ci && npm run build
uv run openkb serve --port 8788
# → http://127.0.0.1:8788
```

## Known limitations

- No authentication — localhost / private network only ([SECURITY.md](SECURITY.md))
- Kanban drag ≠ `openkb done` — agents must use CLI

## Windows

- Prefer `uv run openkb`
- `UV_CACHE_DIR` / `PLAYWRIGHT_BROWSERS_PATH` on a non-system drive if needed

Full changelog: [CHANGELOG.md](CHANGELOG.md) · Upgrade: [UPGRADE.md](UPGRADE.md)
