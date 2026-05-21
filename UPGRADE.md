# Upgrading OpenKB

## 1.0.0 → 1.1.0

1. **Pull / checkout v1.1.0** and reinstall:

   ```bash
   uv sync --dev
   cd web && npm ci && npm run build
   ```

2. **Restart `openkb serve`** (WebSocket + UI bundle).

3. **Optional — portable dogfood path:** The bundled `openkb` project may use `repo_path: .` (relative to `OPENKB_ROOT`). Existing projects with absolute paths still work.

4. **Playwright (contributors):** Browsers default to `.playwright-browsers/` at repo root — set `PLAYWRIGHT_BROWSERS_PATH` to keep off system drive.

5. **No database migration** — workspace layout unchanged.

See [CHANGELOG.md](CHANGELOG.md#110---2026-05-21) for UI and docs additions.

---

## Upgrading to OpenKB 1.0

This section covers moves from **0.1.0 / pre-release snapshots** to **1.0.0**. There is no automatic migration tool — the on-disk layout is stable.

## Workspace layout (unchanged)

```
workspace/projects/{slug}/
├── board/{backlog,todo,doing,review,done}/*.md
├── STATE.md
├── roadmap.yaml
├── decisions/D*.md
├── sessions/*.md
└── project.yaml
```

**Compatibility:** Existing projects created with `openkb project create` remain valid. No file rename required.

## What changed in 1.0

| Area | Before | 1.0 |
|------|--------|-----|
| Hub sync | 2s polling only | WebSocket `/watch` + slower poll fallback |
| Task cleanup | Manual file delete | `openkb task delete <id>` / DELETE API |
| CLI on Windows | GBK console could crash on Unicode | UTF-8 safe output |
| E2E | Probes on `openkb` board | Isolated `e2e-sandbox` project |
| `openkb serve` | `127.0.0.1` only | `--host 0.0.0.0` for Docker |

## Steps after upgrading code

1. **Pull / checkout v1.0.0** and reinstall:

   ```bash
   uv sync --dev
   cd web && npm ci && npm run build
   ```

2. **Restart the API** (required for WebSocket watch):

   ```bash
   uv run openkb serve --port 8788
   ```

3. **Production (single process):** After `npm run build`, `openkb serve` serves `web/dist` when present — no separate Vite dev server.

4. **Agent patch:** Re-run if your AGENTS.md block is older than patch v1:

   ```bash
   uv run openkb agent status
   uv run openkb agent install --all -y   # if needed
   ```

   Current patch id: `openkb-onboarding`, version **1** (see `server/src/openkb/agent_patch_service.py`).

5. **Environment:** Ensure `OPENKB_ROOT` points at the repo root. Agents still need `OPENKB_AGENT_ID`.

## STATE.md / roadmap.yaml

- No schema break. Extra sections in STATE (Recent Done, Next) continue to work.
- Roadmap phase ids (`p0`, `p5c`, …) unchanged.
- ADR `phases:` frontmatter is **optional** — add when you want Decisions/Graph chips.

## Docker users

```bash
docker compose up --build
# → http://127.0.0.1:8788
```

Mount `./workspace` (see `docker-compose.yml`) so projects survive container restarts.

## Rollback

Check out the previous git tag and restart `openkb serve`. Workspace data is forward-compatible; rolling back code only affects server/CLI features, not markdown files.

## Getting help

- Help UI: `/help`
- Agent skill: `skill/openkb-sync/SKILL.md`
- Security: [SECURITY.md](SECURITY.md)
