# OpenKB Agent Patch Format

Version: **v1** · Patch ID: `openkb-onboarding`

> Chinese: [PATCH_FORMAT.zh-CN.md](PATCH_FORMAT.zh-CN.md)

## Purpose

Embed an idempotent, uninstallable OpenKB onboarding block in **coding agent root config** (`AGENTS.md` / `CLAUDE.md`, etc.).  
**Not** written into business repos; managed by OpenKB installer + `agent/install-state.json`.

## Marker block (exact match required)

```markdown
<!-- openkb:patch v=1 id=openkb-onboarding begin -->
(Markdown body, UTF-8)
<!-- openkb:patch v=1 id=openkb-onboarding end -->
```

| Field | Rule |
|-------|------|
| `v` | Integer; must match `patch.version` in `agent/manifest.yaml` |
| `id` | Must match `patch.id`; used for upgrade/uninstall |
| `begin` / `end` | One marker per line; no extra characters |

## Install rules

1. **Block with same `id` exists** → replace entire block (version upgrades update `v=` and body).
2. **File exists, no block** → append `\n\n` + block at EOF.
3. **File missing, parent dir exists** → create file with optional header + block.
4. **State** → record `target_id`, absolute path, version, timestamp in `agent/install-state.json`.

## Uninstall rules

1. Remove begin…end block matching `id=openkb-onboarding` (including marker lines).
2. If file is empty afterward, keep the file (do not auto-delete).
3. Remove entry from `install-state.json`.

## Body placeholder

At install time, `{OPENKB_ROOT}` is replaced with the absolute OpenKB root (forward slashes).

## CLI

```bash
uv run openkb agent scan
uv run openkb agent install
uv run openkb agent install --all -y
uv run openkb agent uninstall --all -y
uv run openkb agent status
uv run openkb agent print-patch
```
