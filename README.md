# OpenKB

Centralized **Agent Kanban + project state hub**: coding agents align progress via CLI; humans manage Spec / Plan / decisions in the Web UI.

Data lives under `workspace/projects/{slug}/` — not scattered as `.openkb/` in each business repo.

> **中文文档:** [README.zh-CN.md](README.zh-CN.md) · **License:** [MIT](LICENSE)

---

## Installation (cross-platform)

Run commands from the **OpenKB root**. Prefer `uv run openkb` (no Windows-only scripts required).

### 1. Dependencies

```bash
cd /path/to/OpenKB
export UV_CACHE_DIR="${UV_CACHE_DIR:-$HOME/.cache/uv}"   # optional

uv sync --dev

cd web
npm install
npm run build
```

### 2. Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENKB_ROOT` | Yes | Absolute path to OpenKB root |
| `OPENKB_AGENT_ID` | Yes | Agent identity (locks, audit) |
| `UV_CACHE_DIR` | Recommended | uv cache directory |
| `OPENKB_PROJECT` | No | Force project slug |

**Linux / macOS:**

```bash
export OPENKB_ROOT="/path/to/OpenKB"
export OPENKB_AGENT_ID="your-agent-name"
export UV_CACHE_DIR="$HOME/.cache/uv"
```

**Windows (PowerShell, current session):**

```powershell
$env:OPENKB_ROOT = "E:/path/to/OpenKB"
$env:OPENKB_AGENT_ID = "your-agent-name"
$env:UV_CACHE_DIR = "E:/uv-cache"
```

**Windows (optional):** user-level env via `.\scripts\setup-openkb-env.ps1` (env + PATH only).

See [`.env.example`](.env.example).

### 3. Agent config patch (recommended, one-time)

Merge OpenKB session entry into your coding agent’s `AGENTS.md` / `CLAUDE.md`. **Not written into business repos.**

```bash
uv run openkb agent scan
uv run openkb agent install              # interactive
uv run openkb agent install --all -y     # all available targets
uv run openkb agent status
uv run openkb agent uninstall --all -y   # remove patch blocks
```

Spec: [`agent/PATCH_FORMAT.md`](agent/PATCH_FORMAT.md) · Chinese: [`agent/PATCH_FORMAT.zh-CN.md`](agent/PATCH_FORMAT.zh-CN.md)

Agent workflow skill: [`skill/openkb-sync/SKILL.md`](skill/openkb-sync/SKILL.md) · Chinese: [`skill/openkb-sync/SKILL.zh-CN.md`](skill/openkb-sync/SKILL.zh-CN.md)

### 4. Start the Hub

**Development** (hot reload):

```bash
# Terminal 1 — API
uv run openkb serve --port 8788

# Terminal 2 — Web UI (dev)
cd web && npm run dev
# → http://127.0.0.1:5173  (EN/ZH toggle in header)
```

**Production** (single process — API serves built UI from `web/dist`):

```bash
cd web && npm run build
uv run openkb serve --port 8788
# → http://127.0.0.1:8788
```

**Docker:**

```bash
docker compose up --build
# → http://127.0.0.1:8788  (persist workspace/ via volume)
```

See [UPGRADE.md](UPGRADE.md) · [SECURITY.md](SECURITY.md) · [CHANGELOG.md](CHANGELOG.md) · [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### 5. Verify

```bash
uv run openkb --help
uv run openkb context --json
uv run pytest
```

---

## Agent CLI (common)

```bash
uv run openkb context --json
uv run openkb status --json
uv run openkb next --json

uv run openkb project create --slug my-app --name "My App" \
  --repo-path /path/to/my-app --link --json

uv run openkb project link --slug my-app   # inside business repo
```

On Windows, if `scripts/` is on PATH, you may use `openkb.cmd` instead of `uv run openkb`.

---

## Web UI

- `/` — Project list
- `/help` — Help & workflows (bilingual guide for humans)
- `/projects/:slug` — Overview / Kanban / Spec / Plan / **Roadmap (interactive DAG)** / Decisions

The **Roadmap** page is an interactive graph: pan/zoom, click phases for tasks and links to Plan / Kanban / ADRs. See ADR `D006`.

**Decisions ↔ phases:** optional YAML frontmatter on ADR files (`phases: [p7, p10]`) links decisions to roadmap phases; chips appear on Decisions and in the graph panel.

UI supports **English / 中文** (header language toggle).

**Live sync (V2):** Hub subscribes to WebSocket `/api/projects/{slug}/watch`. CLI and API mutations broadcast changes; UI refreshes immediately. Falls back to ~2s polling when disconnected.

**Kanban drag vs CLI:** UI drag only moves the task column — it does **not** update STATE, session logs, lock, or roadmap. Agents must use `openkb checkout` / `openkb done`. See `/help` and skill `openkb-sync`.

### E2E (Playwright)

E2E uses an isolated project **`e2e-sandbox`** (never the dogfood `openkb` board). CI runs the same suite via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

```bash
# From web/ (Playwright starts API + Vite dev server automatically)
export OPENKB_ROOT="/path/to/OpenKB"
export UV_CACHE_DIR="${UV_CACHE_DIR:-$PWD/../.uv-cache}"

# Windows (PowerShell) — keep browsers off C: if needed
$env:OPENKB_ROOT = "E:/path/to/OpenKB"
$env:PLAYWRIGHT_BROWSERS_PATH = "E:/playwright-browsers"

npm run test:e2e
```

Prefer **`uv run openkb`** on Windows (UTF-8 safe). Legacy probe files on `openkb` are cleaned on E2E setup; use `openkb task delete <id>` when the API is up.

---

## Security

OpenKB 1.0 has **no authentication**. Use on **localhost or a trusted private network** only. Do not expose port 8788 to the public internet without a proxy and auth. Details: [SECURITY.md](SECURITY.md).

---

## Windows quick reference

| Topic | Recommendation |
|-------|----------------|
| CLI | `uv run openkb …` (not only PowerShell wrappers) |
| Caches | `UV_CACHE_DIR=E:/uv-cache` |
| E2E browsers | `PLAYWRIGHT_BROWSERS_PATH=E:/playwright-browsers` |
| Console encoding | Fixed in 1.0 — Unicode titles and `«guillemets»` safe |

---

## Architecture decisions

See `workspace/projects/openkb/decisions/`.
