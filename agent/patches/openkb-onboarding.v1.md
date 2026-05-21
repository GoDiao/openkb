## OpenKB (centralized project hub)

OpenKB is installed on this machine. **Kanban, STATE, roadmap, and Spec/Plan pointers** live in the OpenKB Hub — not as board files in business repos.

**Environment:** `OPENKB_ROOT={OPENKB_ROOT}` · `OPENKB_AGENT_ID` (required)  
**CLI:** `uv run --directory {OPENKB_ROOT} openkb …` (or `openkb.cmd` on Windows PATH)

### Session start (in a business repo or with `OPENKB_PROJECT` set)

1. `openkb context --json` — full picture (STATE / roadmap / docs status)
2. `openkb next --json` — or read `next` from context and pick the next task
3. `openkb status --json` — board columns and in-progress tasks

### Four workflows

| Scenario | Action |
|----------|--------|
| New OpenKB project from scratch | Skill §4 → `project create` |
| Existing repo, first-time hub setup | Skill §6 → `project show` + align Spec/Plan/roadmap |
| Day-to-day progress updates | Skill §5 → `checkout` → work → `done` + `state set` |
| Spec/Plan changes | Edit files in **business repo** + `doc verify` |

**Full playbook:** `{OPENKB_ROOT}/skill/openkb-sync/SKILL.md`

### Key conventions

- Spec/Plan bodies live under `{repo_path}`; Hub reads paths from `project.yaml` (`docs.spec` / `docs.plan`)
- Runtime Kanban/STATE via CLI only — do not hand-edit `workspace/projects/*/board/` or `STATE.md`
- Business repo binding: `.openkb-link` (one-line slug) or `OPENKB_PROJECT`

**Hub (local):** `http://127.0.0.1:5173/projects/{slug}` · API: `openkb serve --port 8788`
