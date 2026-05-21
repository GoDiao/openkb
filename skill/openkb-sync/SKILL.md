---
name: openkb-sync
description: >-
  OpenKB project archivist. Supports: (1) new project create (2) incremental sync
  for existing projects (tasks, progress, Spec/Plan). Spec/Plan live under repo_path;
  run doc verify after writing. Requires OPENKB_ROOT + openkb.cmd.
---

# OpenKB Sync

Agent responsibility: **Every Hub page the user opens must reflect the real project.**  
Writing markdown that **the Hub cannot load** = failure (Hermes/YONOH once had blank Spec/Plan pages for this reason).

---

## Which mode? (Agent: infer user intent first)

| User / scenario | Mode | Do not |
|-----------------|------|--------|
| "New project", "new idea", "no OpenKB project yet" | **§4 New project** → `project create` | Do not `create` an existing slug |
| "Update progress", "sync board", "I did X", "continue Hermes/YONOH" | **§5 Existing project · incremental sync** | Do not `project create`; do not overwrite Spec |
| "Change Spec/Plan", "new design from discussion" | **§2 + §5.3 Doc updates** | Do not change code only without updating Hub |
| "Pick up task / finish / close ticket" | **§5.2 Board runtime** | Do not commit only without `done` |

**One skill, two main flows:** new = create; existing = context → incremental updates.

---

## 0. Environment

| Variable | Required |
|----------|----------|
| `OPENKB_ROOT` | OpenKB root directory |
| `OPENKB_AGENT_ID` | Agent identity |

Run: `openkb.cmd …` (or `uv run --directory $env:OPENKB_ROOT openkb …`).

For API/UI development: `uv run openkb serve --port 8788` + `cd web && npm run dev` (5173).

---

## 1. How the Hub loads Spec / Plan (required)

```
Web UI  /projects/{slug}/spec
    → GET /api/projects/{slug}/docs/spec
        → read project.yaml docs.spec (relative path)
        → open file: {repo_path}/{docs.spec}   ← only correct location
        → return content, render Markdown
```

**Plan page** works the same way, reading `docs.plan`.

| Field | In project.yaml | Actual file location |
|-------|-----------------|----------------------|
| `repo_path` | `E:/.../hermes-agent` | Business git repo root |
| `docs.spec` | `docs/spec.md` | **`E:/.../hermes-agent/docs/spec.md`** |
| `docs.plan` | `docs/plan.md` | **`E:/.../hermes-agent/docs/plan.md`** |

### Typical wrong-location mistakes

| Where the agent writes | Hub visible? |
|------------------------|--------------|
| `OpenKB/workspace/projects/{slug}/spec.md` | ❌ Never |
| `OpenKB/docs/spec.md` (unless repo_path is OpenKB itself) | ❌ Usually not |
| `{repo_path}/docs/spec.md` with `set-docs` registered | ✅ |
| `{repo_path}/other/design.md` + `set-docs --spec other/design.md` | ✅ |

**Conclusion: Spec/Plan are files in the business repo; workspace only stores pointers (project.yaml), not Spec/Plan body text.**

Per **D004**: `project set-docs` **registers paths only** — it does not generate document content. Agents write Spec/Plan/Decision/roadmap content directly.

---

## 2. How to write Spec / Plan (step by step)

### 2.1 Confirm project binding

```powershell
openkb.cmd project show --json
```

Note:

- `project.repo_path` → business repo root  
- `project.docs.spec` / `project.docs.plan` → relative paths (may be empty)

### 2.2 Choose paths and register them

Recommended defaults (change if needed):

- Spec → `{repo_path}/docs/spec.md`  
- Plan → `{repo_path}/docs/plan.md`

```powershell
openkb.cmd project set-docs --spec docs/spec.md --plan docs/plan.md --json
```

If the project already has docs (e.g. `docs/design/yonoh-spec.md`), **register the real path** — do not force the default:

```powershell
openkb.cmd project set-docs --spec docs/design/yonoh-spec.md --json
```

### 2.3 Write files in the business repo

Create or edit Markdown **under `repo_path`** (editor/Write tool — not workspace):

**Suggested Spec structure:**

```markdown
# {Project Name} — Design Spec
**Status:** Draft | Approved
**Project slug:** `{slug}`

## Summary
(One paragraph: what this project is)

## Problem / Goals / Non-Goals
## Architecture
## Current Status / Phases
```

**Suggested Plan structure:**

```markdown
# {Project Name} — Implementation Plan
**Status:** Active
**Spec:** `docs/spec.md`

## Goal
(One sentence)

## Phase 0: Title
(steps, acceptance criteria)

## Phase 1: Title
...
```

Plan **`## Phase N:` headings** must match `roadmap.yaml` `plan_ref: "Phase N"` for the Plan page sidebar to show ✓/●. This is **agent-authored alignment** — OpenKB does not parse Plan into roadmap automatically (D004).

When editing existing Spec/Plan: **add or revise sections; do not replace the whole document** with a template.

### 2.4 Verify after writing (incomplete without verify)

```powershell
openkb.cmd doc verify --json
```

Expected:

```json
"hub_checks": [
  { "kind": "spec", "hub_visible": true, "absolute_path": "E:/.../hermes-agent/docs/spec.md" },
  { "kind": "plan", "hub_visible": true, ... }
],
"all_hub_visible": true
```

Any `hub_visible: false` → file not at `repo_path/relative-path`, or path not registered → **fix and verify again**.

Optional: confirm API reads content:

```powershell
openkb.cmd doc spec --json
openkb.cmd doc plan --json
```

### 2.5 Sync roadmap (otherwise Graph/Plan progress stays wrong)

After Spec/Plan are written, **rewrite** `workspace/projects/{slug}/roadmap.yaml` so phases align with Plan phases (**remove** the default spec/plan/build template from `create`).

---

## 3. Hub page data sources (overview)

| Page | Data from | Agent maintains |
|------|-----------|-----------------|
| **Spec** | `{repo_path}/{docs.spec}` | Write business repo file + set-docs |
| **Plan** | `{repo_path}/{docs.plan}` | Same |
| **Graph** | `workspace/.../roadmap.yaml` | Hand-write yaml, align with Plan phases |
| **Decisions** | `workspace/.../decisions/D*.md` | Write D001-….md |
| **Overview** | STATE.md + roadmap summary | `state set` |
| **Kanban** | board/* | CLI task create/checkout/done |

**D004 split:** content assets (Spec, Plan, Decision, roadmap structure) → agent writes files. Runtime state (Kanban, STATE.md, phase status) → agent uses CLI.

---

## 4. New project flow

```powershell
openkb.cmd project create --slug X --name "..." --repo-path E:/path/to/repo --link --json
# 1. Edit E:/path/to/repo/docs/spec.md and plan.md (replace [TODO])
# 2. openkb.cmd doc verify --json  → all_hub_visible true
# 3. Rewrite roadmap.yaml
# 4. state set / task create / decisions
```

Do not use bootstrap CLIs that parse Plan into roadmap/Kanban — agents author roadmap and tasks directly (D004).

---

## 5. Existing project · incremental sync (most common)

**When:** Project already exists in OpenKB (e.g. `hermes-agent-yonoh`); agent finished work or discussed changes; user asks to "update progress / sync board / reflect in OpenKB".

### 5.1 Session start (~30 seconds)

From **business repo root** (or with `OPENKB_PROJECT` set):

```powershell
openkb.cmd context --json
openkb.cmd project show --json      # pending, docs paths
openkb.cmd status --json            # board state
openkb.cmd roadmap --json           # current phase
```

Confirm `project` is the target slug — **do not** `project create`.

### 5.2 Code-only / task completed → update board

```powershell
# If a task is in progress
openkb.cmd checkout <id> --json
openkb.cmd note <id> "what was done, what was tested" --json

# Complete
openkb.cmd done <id> --json
# → auto: crosses first Next item, may advance roadmap phase

# One-line status
openkb.cmd state set --summary "Finished X; next Y" --json
openkb.cmd state set --next "next item" --next "item after that" --json

# Whole phase done
openkb.cmd roadmap complete p2 --json
```

**New work discovered** (not in Plan):

```powershell
openkb.cmd task create --title "concrete description" --priority P1 --json
```

### 5.3 Discussion / product changed → update docs + progress graph

| What changed | Action |
|--------------|--------|
| Scope / architecture | **Edit** `{repo_path}/{docs.spec}` (add sections; do not replace whole doc) |
| Steps / new Phase | **Edit** `{repo_path}/{docs.plan}` + **sync** `roadmap.yaml` |
| New decision | New `workspace/.../decisions/D00N-….md` |
| Phase status | `roadmap complete/set` or edit roadmap.yaml status |

After writing:

```powershell
openkb.cmd doc verify --json
```

### 5.4 Incremental sync checklist (before session end)

- [ ] `state.summary` reflects **today's** work  
- [ ] Completed tasks are `done` (not stuck in doing)  
- [ ] New tasks created if user assigned new work verbally  
- [ ] Spec/Plan/roadmap match discussion (change only when needed)  
- [ ] Active phase in `roadmap` matches current work  
- [ ] Optional: `doc verify` + quick browser check of Overview/Kanban  

### 5.5 One-line user report template

> Synced OpenKB `{slug}`: completed task `{id}` / updated STATE / roadmap `{phase}` → active|done. Hub Overview and Kanban updated.

---

## 6. Onboarding an existing repo (first OpenKB link)

1. `project show` — repo_path and docs pointers  
2. **Read** `{repo_path}/{docs.spec}` — if content exists, **augment**; do not overwrite with template  
3. `doc verify` — until hub_visible  
4. Align roadmap / STATE / Kanban  

(Use `project create` only if there is no OpenKB project record yet — see §4.)

---

## 7. Runtime CLI

```powershell
openkb.cmd checkout <id> --json
openkb.cmd done <id> --json
openkb.cmd state set --summary "…" --json
openkb.cmd roadmap complete p2 --json
openkb.cmd task create --title "…" --priority P0 --json
openkb.cmd task delete <id> --json          # backlog/todo/doing/review only; --force for done
```

Do **not** hand-edit `board/*.md` or `STATE.md`. Hand-editing Spec/Plan/decisions/roadmap.yaml is allowed (at correct paths).

### Kanban UI drag vs CLI (important)

| | UI drag on Kanban | CLI `checkout` / `done` |
|--|-------------------|-------------------------|
| Task column file | ✅ | ✅ |
| STATE.md (active, Next, Recent Done) | ❌ | ✅ |
| Session log (`sessions/`) | ❌ | ❌ on drag; ✅ on done/release |
| Lock | ❌ | ✅ checkout sets; done clears |
| Roadmap phase auto-complete | ❌ | ✅ when phase tasks all done |

**Agents must use CLI** — not Hub drag — for completing work. Humans may drag for visual triage; dragging to **Done** does not substitute for `openkb done`. Hub Help: `/help` (section *Kanban drag vs Agent CLI*).

Hub **WebSocket V2** (`/api/projects/{slug}/watch`) pushes board/state/roadmap updates when CLI or API mutates; polling is fallback only.

---

## 8. Pre-exit self-check

- `doc verify` → `all_hub_visible: true`  
- Graph phases = Plan phases, not "Spec finalized / Plan finalized / Build" template  
- Decisions page has D*.md (not only _README)  
- Overview Summary describes **this project**

**Open** `/projects/{slug}/spec` and `/plan` in the browser and confirm body text is visible before ending.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Spec page "cannot load" or spins forever | File not at `repo_path/path` or API not restarted | `doc verify`; fix path; restart `openkb serve` |
| `exists: false` | Wrong directory | Move to `{repo_path}/{docs.spec}` |
| Long doc written but UI blank | Written under workspace or OpenKB root | Rewrite in business repo |
| Graph unrelated to Plan | roadmap still `create` template | Rewrite roadmap.yaml |
| `doc verify` OK but UI 404 | Stale API process | Restart serve (with OPENKB_ROOT set) |

---

## 10. Example: Hermes Agent / YONOH

- slug: `hermes-agent-yonoh`  
- repo_path: `E:/AProject/TianX/Personal/hermes-agent`  
- Spec: `hermes-agent/docs/spec.md`  
- Plan: `hermes-agent/docs/plan.md`  
- Verify: `openkb.cmd doc verify --project hermes-agent-yonoh --json`
