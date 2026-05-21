# Demo & recording guide

Use this to produce **screenshots**, a **GIF**, or a **short video** for the README and GitHub social preview.

## Quick demo (local)

```bash
export OPENKB_ROOT="$(pwd)"
export OPENKB_AGENT_ID="demo-agent"
uv run openkb serve --port 8788
# → http://127.0.0.1:8788  (production build from web/dist)
```

Or dev mode: API on 8788 + `cd web && npm run dev` → http://127.0.0.1:5173

The **dogfood project** `openkb` is preloaded under `workspace/projects/openkb/` — open `/projects/openkb` for a realistic Overview, Kanban, Spec, Plan, and Roadmap.

---

## Automated screenshots

From `web/` (starts API + Vite if not running — uses Playwright config):

```bash
export OPENKB_ROOT="/path/to/openkb"
export PLAYWRIGHT_BROWSERS_PATH="/path/to/.playwright-browsers"   # optional, keep off C:

npm run demo:capture
```

Output: `docs/assets/demo/*.png`

Suggested GIF frames: `01-hub-projects.png` → `02-overview.png` → `03-kanban.png` → `04-roadmap.png`

Tools: [ScreenToGif](https://www.screentogif.com/) (Windows), `ffmpeg`, or GitHub's asset uploader.

---

## 60-second video script

| Sec | Scene | Action |
|-----|-------|--------|
| 0–8 | Project list | Show OpenKB header, EN/中文 toggle, theme picker |
| 8–18 | Overview | Progress ring + board chart animating; click quick link to Kanban |
| 18–30 | Kanban | Drag a card; open task sidebar; mention CLI `checkout` / `done` |
| 30–40 | Terminal | `uv run openkb done <id> --json` → toast "Kanban updated" in UI |
| 40–50 | Spec / Plan | TOC scroll; highlight doc from business `repo_path` |
| 50–60 | Roadmap | Pan/zoom graph; click phase panel → link to Plan ADR |

Voiceover (EN): *"Agents sync through the CLI. Humans read Spec, Plan, and the roadmap in one Hub — live."*

---

## Hosted demo (optional)

v1 does **not** ship a public demo site (no auth). Options for maintainers:

1. **Record-only** — GIF/video in README (recommended for now)  
2. **Read-only VPS** — Hub behind Cloudflare Access / Basic Auth; reset `workspace/` nightly  
3. **GitHub Codespaces** — add `.devcontainer/` (future); user runs `openkb serve` in cloud workspace  

Document any public URL in README only after TLS + auth are in place.

---

## After recording

1. Save GIF as `docs/assets/demo/hub-demo.gif`  
2. Add to README: `![OpenKB demo](docs/assets/demo/hub-demo.gif)`  
3. Attach to GitHub Release v1.1.0  

See also [WHY_OPENKB.md](WHY_OPENKB.md)
