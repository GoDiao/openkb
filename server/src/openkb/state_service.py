from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

from openkb.models import StateModel, StateNow

_NOW_KEYS = {
    "active task": "active_task",
    "owner": "owner",
    "branch": "branch",
    "blocker": "blocker",
}


def _split_sections(text: str) -> dict[str, str]:
    sections: dict[str, str] = {}
    current: str | None = None
    buf: list[str] = []
    for line in text.splitlines():
        m = re.match(r"^## (.+?)\s*$", line.strip())
        if m:
            if current is not None:
                sections[current] = "\n".join(buf).strip()
            current = m.group(1).strip()
            buf = []
        else:
            buf.append(line)
    if current is not None:
        sections[current] = "\n".join(buf).strip()
    return sections


def _parse_header(text: str) -> tuple[str, str]:
    last_updated = ""
    updated_by = "system"
    for line in text.splitlines():
        m = re.match(r"^> Last updated:\s*(.+?)\s+by\s+(.+?)\s*$", line.strip())
        if m:
            last_updated = m.group(1).strip()
            updated_by = m.group(2).strip()
            break
    return last_updated, updated_by


def _parse_now(body: str) -> StateNow:
    fields: dict[str, str] = {}
    for line in body.splitlines():
        m = re.match(r"^-\s+\*\*(.+?)\*\*:\s*(.+?)\s*$", line.strip())
        if m:
            key = m.group(1).strip().lower()
            if key in _NOW_KEYS:
                fields[_NOW_KEYS[key]] = m.group(2).strip()
    return StateNow(
        active_task=fields.get("active_task", "none"),
        owner=fields.get("owner", "—"),
        branch=fields.get("branch", "main"),
        blocker=fields.get("blocker", "none"),
    )


def _parse_list_items(body: str) -> list[str]:
    items: list[str] = []
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        m = re.match(r"^\d+\.\s+(.+)$", stripped)
        if m:
            items.append(m.group(1).strip())
            continue
        if stripped.startswith("- "):
            items.append(stripped[2:].strip())
    return items


def _parse_summary(body: str) -> str:
    lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
    return "\n".join(lines)


def read_state(path: Path) -> StateModel:
    text = path.read_text(encoding="utf-8")
    last_updated, updated_by = _parse_header(text)
    sections = _split_sections(text)
    return StateModel(
        now=_parse_now(sections.get("Now", "")),
        summary=_parse_summary(sections.get("Summary", "")),
        next_items=_parse_list_items(sections.get("Next", "")),
        recent_done=_parse_list_items(sections.get("Recent Done", "")),
        decisions=_parse_list_items(sections.get("Decisions", "")),
        watch_out=_parse_list_items(sections.get("Watch Out", "")),
        last_updated=last_updated,
        updated_by=updated_by,
    )


def write_state(path: Path, state: StateModel, project_slug: str) -> None:
    last_updated = state.last_updated or "1970-01-01 00:00"
    updated_by = state.updated_by or "system"
    next_block = "\n".join(f"{i + 1}. {item}" for i, item in enumerate(state.next_items))
    recent_block = "\n".join(f"- {item}" for item in state.recent_done)
    decisions_block = "\n".join(f"- {item}" for item in state.decisions)
    watch_block = "\n".join(f"- {item}" for item in state.watch_out)
    text = f"""# Project State

> Read first, update last. Maintained by agents and humans via OpenKB.
> Last updated: {last_updated} by {updated_by}
> OpenKB path: `workspace/projects/{project_slug}/`

## Now

- **Active task**: {state.now.active_task}
- **Owner**: {state.now.owner}
- **Branch**: {state.now.branch}
- **Blocker**: {state.now.blocker}

## Summary

{state.summary}

## Next

{next_block}

## Recent Done

{recent_block}

## Decisions

{decisions_block}

## Watch Out

{watch_block}
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    from openkb.watch_service import notify_project_change

    notify_project_change(project_slug, ["state"])


def patch_state_fields(
    state: StateModel,
    *,
    summary: str | None = None,
    next_items: list[str] | None = None,
    watch_out: list[str] | None = None,
    blocker: str | None = None,
    agent_id: str,
) -> StateModel:
    if summary is not None:
        state.summary = summary
    if next_items is not None:
        state.next_items = next_items
    if watch_out is not None:
        state.watch_out = watch_out
    if blocker is not None:
        state.now.blocker = blocker
    state.last_updated = datetime.now().strftime("%Y-%m-%d %H:%M")
    state.updated_by = agent_id
    return state
