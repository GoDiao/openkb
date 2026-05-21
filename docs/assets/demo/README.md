# Demo assets

Place marketing assets here:

| File | Description |
|------|-------------|
| `01-hub-projects.png` | Project list |
| `02-overview.png` | Overview with progress ring + board chart |
| `03-kanban.png` | Kanban board |
| `04-roadmap.png` | Interactive roadmap graph |
| `hub-demo.gif` | 60s recording (see [DEMO.md](../DEMO.md)) |

Generate PNGs:

```bash
cd web
export OPENKB_ROOT="$(git rev-parse --show-toplevel)"
npm run demo:capture
```

PNG files are gitignored until you opt in — remove `*.png` from local ignore or `git add -f` when ready for release.
