# Publishing OpenKB

## Current recommendation (v1.1)

| Channel | Status | Notes |
|---------|--------|-------|
| **Git clone + `uv run openkb`** | ✅ Primary | Matches agent workflow; no install step |
| **Docker** | ✅ Supported | `docker compose up` |
| **GitHub Releases** | ✅ Tags + changelog | Attach optional demo GIF |
| **PyPI (`pip install openkb`)** | ⏳ Deferred | Package layout works (`pyproject.toml`); publish when we add `twine`/CI job and semver policy |
| **npm** | ❌ N/A | Hub UI is bundled into Python serve or built to `web/dist` |

### Why git/uv first?

- Agents already run from a checkout with `OPENKB_ROOT`  
- Spec/Plan paths point at business repos on disk  
- Fewer version skew issues between CLI, API, and UI  

### Future PyPI (when ready)

1. Ensure `hatchling` wheel includes `web/dist` or documents build step  
2. Add `.github/workflows/publish.yml` on tag (manual `workflow_dispatch` OK)  
3. `uv publish` / `twine upload` with `PYPI_TOKEN` secret  

Until then, document install as:

```bash
git clone https://github.com/GoDiao/openkb.git
cd openkb && uv sync --dev
cd web && npm ci && npm run build
```

---

## Release checklist

- [ ] `uv run pytest`  
- [ ] `cd web && npm run build && npm run test:e2e`  
- [ ] Update `CHANGELOG.md` and `pyproject.toml` version  
- [ ] `git tag vX.Y.Z && git push origin vX.Y.Z`  
- [ ] GitHub Release with notes from changelog  
- [ ] Optional: demo GIF in `docs/assets/demo/`  

See [CONTRIBUTING.md](../CONTRIBUTING.md)
