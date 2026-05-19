# OpenKB Design Spec

**Date:** 2026-05-20  
**Status:** Approved  
**Scope:** V1 — CLI + REST API + Web UI (Standard/B tier)

---

## 1. Problem Statement

In the vibecoding era, multiple coding agents (Cursor, Claude Code, Codex, etc.) work across many projects simultaneously. Progress alignment is hard: sessions break, agents duplicate work, and humans lack a single view of "where we are now."

OpenKB is a **centralized** Kanban and progress platform where:

- **Agents** interact exclusively via `openkb` CLI (JSON output, no MCP).
- **Humans** interact exclusively via Web UI (never edit workspace files directly).
- **Storage** is git-friendly files under `workspace/projects/{slug}/`, shared by CLI and API through one Storage Layer.

---

## 2. Goals & Non-Goals

### Goals (V1)

- Centralized project/task state in OpenKB workspace
- Agent session start aligns in one command: `openkb context --json`
- Checkout locks prevent concurrent agent conflicts
- Human Kanban UI with drag-and-drop, STATE panel, project CRUD
- Project binding via `repo_path` auto-match + `.openkb-link` override

### Non-Goals (V1)

- MCP server
- Decisions ADR UI, sessions timeline UI, cross-project dashboard
- WebSocket real-time sync (poll/refetch instead)
- Git integration, Paperclip sync, multi-user auth

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     OpenKB Process                       │
├──────────────┬──────────────────────┬───────────────────┤
│  openkb CLI  │   FastAPI REST API   │   React Web UI    │
│  (Agents)    │   (UI backend)       │   (Humans)        │
└──────┬───────┴──────────┬───────────┴─────────┬─────────┘
       │                  │                     │
       └──────────────────┼─────────────────────┘
                          ▼
              ┌───────────────────────┐
              │   Storage Layer       │
              │   (Python, file I/O)  │
              └───────────┬───────────┘
                          ▼
              workspace/projects/{slug}/
```

### Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Python 3.12+, managed with uv |
| API | FastAPI |
| CLI | typer, JSON via `--json` flag |
| Frontend | React 19, Vite, TypeScript |
| Storage | Markdown + YAML frontmatter on disk |

### Deployment

- `openkb serve --port 8787` starts API and serves static UI on one port.
- CLI operates on storage directly; server need not be running for agent workflows.

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENKB_ROOT` | Path to OpenKB install (default: auto-detect from CLI location) |
| `OPENKB_PROJECT` | Force project slug (overrides auto-detection) |

---

## 4. Workspace Layout

```
OpenKB/
├── workspace/
│   └── projects/
│       └── {slug}/
│           ├── project.yaml
│           ├── STATE.md
│           ├── board/
│           │   ├── backlog/
│           │   ├── todo/
│           │   ├── doing/
│           │   ├── review/
│           │   └── done/
│           ├── decisions/     # V2 UI; files may exist in V1
│           └── sessions/      # CLI appends on done/release
├── server/src/openkb/         # Python package
├── web/                       # React app
├── skill/openkb-sync/         # Agent skill
└── docs/
```

---

## 5. Project Binding (Option D)

When an agent runs CLI from any directory, resolve project slug in order:

1. `OPENKB_PROJECT` environment variable
2. Walk up from cwd: read `.openkb-link` (single line = slug)
3. Scan `workspace/projects/*/project.yaml`: match `repo_path` to cwd (normalized paths)
4. Fail with exit code 1 and message: run `openkb project link --slug <slug>`

### `.openkb-link` (in dev repo root)

```
plotpilot
```

### `project.yaml`

```yaml
slug: plotpilot
name: PlotPilot
repo_path: E:/AProject/TianX/Personal/PlotPilot
description: Short description
status: active          # active | archived
default_branch: main
lock_ttl_hours: 4
created: "2026-05-20"
```

---

## 6. Data Models

### 6.1 Task Card

File: `board/{column}/{id}-{slug}.md`

Frontmatter:

```yaml
id: "003"
title: "Implement auth middleware"
status: doing           # must match parent column directory
priority: P0            # P0 | P1 | P2 | P3
assignee: ""
branch: main
created: "2026-05-20"
updated: "2026-05-20T14:30:00Z"
locked_by: ""
locked_at: ""
lock_expires: ""
tags: []
related_files: []
```

Body sections (fixed order):

- `## Goal`
- `## Acceptance` (checkbox list)
- `## Context`
- `## Notes` (append-only during work)

### 6.2 STATE.md

Parsed into structured fields for UI; written back as Markdown.

| Section | Purpose |
|---------|---------|
| Now | active_task, owner, branch, blocker |
| Summary | 2–4 sentence frontier summary |
| Next | ordered priority list |
| Recent Done | last 5 completed items |
| Decisions | links to decisions/*.md |
| Watch Out | pitfalls / constraints |

Header metadata:

```markdown
> Last updated: 2026-05-20 14:30 by cursor-1
> OpenKB path: `workspace/projects/plotpilot/`
```

### 6.3 Lock Protocol

- **checkout**: set `locked_by`, `locked_at`, `lock_expires` (now + `lock_ttl_hours`), move to `doing/`, update STATE.Now
- **conflict**: if valid lock held by another agent → HTTP 409 / CLI exit 2, JSON `{ "error": "locked", "owner": "..." }`
- **expired lock**: allow takeover; append takeover note to task Notes
- **done**: clear lock, move to `done/`, update STATE (Recent Done, Now, Next)
- **release**: clear lock, move back to `todo/`, update STATE

---

## 7. CLI Specification

All commands support `--json`. Errors on stderr; structured errors in JSON when `--json`.

| Command | Description |
|---------|-------------|
| `openkb context` | Resolve project + return STATE summary + active task |
| `openkb next` | Next available task (priority order, skip valid locks) |
| `openkb checkout <id>` | Acquire lock, move to doing, update STATE |
| `openkb release <id>` | Release lock, move to todo |
| `openkb done <id>` | Complete task, update STATE, write session log |
| `openkb note <id> "<text>"` | Append Notes, bump updated |
| `openkb check <id> <n>` | Toggle acceptance item n |
| `openkb status` | Full board snapshot |
| `openkb task create --title T [--priority P1]` | Create in backlog |
| `openkb project list` | List all projects |
| `openkb project link [--slug S]` | Write `.openkb-link` in cwd repo |
| `openkb serve [--port 8787]` | Start API + UI |

### `openkb context --json` Response

```json
{
  "project": "plotpilot",
  "repo_path": "E:/AProject/TianX/Personal/PlotPilot",
  "state": {
    "active_task": "003-auth-middleware",
    "owner": "cursor-1",
    "branch": "feat/auth",
    "summary": "Implementing refresh mutex...",
    "next": ["Finish refresh mutex", "Write concurrency test"],
    "blocker": null
  },
  "checked_out_by_me": false
}
```

Agent identity for locks: `OPENKB_AGENT_ID` env var, or hostname + tool name fallback.

---

## 8. REST API Specification

Storage Layer is shared with CLI. No duplicate business logic in route handlers.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project (slug, name, repo_path) |
| PATCH | `/api/projects/{slug}` | Update metadata / archive |
| GET | `/api/projects/{slug}/board` | Tasks grouped by column |
| GET | `/api/projects/{slug}/state` | Parsed STATE |
| PATCH | `/api/projects/{slug}/state` | Update STATE fields |
| GET | `/api/projects/{slug}/tasks/{id}` | Task detail |
| POST | `/api/projects/{slug}/tasks` | Create task |
| PATCH | `/api/projects/{slug}/tasks/{id}` | Update task |
| POST | `/api/projects/{slug}/tasks/{id}/move` | Move column `{ "column": "review" }` |
| POST | `/api/projects/{slug}/tasks/{id}/checkout` | Manual checkout |
| POST | `/api/projects/{slug}/tasks/{id}/release` | Release lock |

Static files: serve `web/dist` from same process.

---

## 9. Web UI (Standard / B Tier)

### Routes

- `/` — Project list (cards: name, active task one-liner, summary snippet)
- `/projects/:slug` — Project workspace

### Project Workspace Layout

```
┌─────────────────────────────────────────────────────────┐
│ Header: name | branch | owner | [+ New Task]            │
├──────────────────────────────┬──────────────────────────┤
│ STATE Panel                  │ Task Detail Sidebar      │
│ Now / Summary / Next         │ (opens on card click)    │
│ Blocker / Watch Out          │                          │
├──────────────────────────────┴──────────────────────────┤
│ Kanban: Backlog | Todo | Doing | Review | Done          │
│ Cards: title, priority badge, lock badge, assignee      │
└─────────────────────────────────────────────────────────┘
```

### Interactions

- Drag card → `POST .../move`
- Edit STATE panel fields → `PATCH .../state`
- Edit task in sidebar → `PATCH .../tasks/{id}`
- New project form → `POST /api/projects`
- Poll board every 3s or refetch after mutations

### Lock Display

Doing column cards show: agent name + remaining lock time (from `lock_expires`).

### Theme (Day / Night)

- **Night — 静夜:** dark command-center aesthetic for long evening sessions
- **Day — 晨光:** warm paper-like light theme (not cold gray); same layout and accent gold family
- Default: follow OS `prefers-color-scheme`; user override persisted in `localStorage` (`openkb-theme`)
- Implementation: CSS semantic tokens on `html[data-theme="light|dark"]`; no hardcoded colors in components
- AppShell includes accessible theme toggle (sun/moon)

---

## 10. Agent Skill (`openkb-sync`)

Location: `skill/openkb-sync/SKILL.md`

Rules:

1. **Never** read/write `workspace/` files directly — use CLI only.
2. Session start: `openkb context --json`
3. If `checked_out_by_me` → continue that task
4. If active task locked by another → `openkb status --json`, do not steal
5. Else: `openkb next --json` → `openkb checkout <id>`
6. During: `openkb note`, `openkb check`
7. Session end: `openkb done` or `openkb note` + keep checkout

---

## 11. Storage Layer Modules

```
server/src/openkb/
├── __init__.py
├── config.py           # OPENKB_ROOT, paths
├── models.py           # Task, Project, State dataclasses
├── project_resolver.py # D binding logic
├── markdown_io.py      # frontmatter parse/serialize
├── state_service.py    # STATE.md read/write
├── task_service.py     # CRUD, move, lock
├── project_service.py  # project CRUD
├── cli/                # typer app
└── api/                # FastAPI routes
```

Single responsibility per module. CLI and API import services only.

---

## 12. Error Handling

| Case | CLI | API |
|------|-----|-----|
| Project not found | exit 1 | 404 |
| Task not found | exit 1 | 404 |
| Lock conflict | exit 2 | 409 |
| Invalid column/status | exit 1 | 400 |
| Storage I/O error | exit 1 | 500 |

---

## 13. Testing Strategy

- **Unit tests**: markdown_io, state_service, task_service, project_resolver (pytest)
- **Integration tests**: CLI commands against temp workspace fixture
- **API tests**: FastAPI TestClient against temp workspace
- **Manual**: UI drag-drop, STATE edit, agent skill dry-run with `openkb context`

---

## 14. Implementation Phases

1. **Storage + models** — parse/write task cards and STATE.md
2. **CLI core** — context, next, checkout, done, note, status
3. **API** — mirror CLI operations
4. **Web UI** — project list + Kanban + STATE panel
5. **Skill** — openkb-sync/SKILL.md
6. **Polish** — project link, serve command, README

---

## 15. Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Per-project vs centralized storage | Centralized in OpenKB/workspace |
| Agent interface | CLI only (no MCP) |
| Human interface | Web UI only (no direct file edit) |
| Project binding | D: repo_path + .openkb-link |
| V1 UI scope | B: Kanban + STATE panel + project CRUD |
