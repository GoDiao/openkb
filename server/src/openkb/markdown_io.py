from __future__ import annotations

import re
from pathlib import Path

import frontmatter

from openkb.models import BoardColumn, TaskModel

SECTIONS = ["Goal", "Acceptance", "Context", "Notes"]


def _parse_sections(body: str) -> dict[str, str | list[str]]:
    parts: dict[str, str] = {s.lower(): "" for s in SECTIONS}
    current: str | None = None
    buf: list[str] = []
    for line in body.splitlines():
        m = re.match(r"^## (\w+)\s*$", line.strip())
        if m and m.group(1) in SECTIONS:
            if current:
                parts[current.lower()] = "\n".join(buf).strip()
            current = m.group(1)
            buf = []
        else:
            buf.append(line)
    if current:
        parts[current.lower()] = "\n".join(buf).strip()
    acceptance_raw = parts["acceptance"]
    acceptance = [
        ln.strip() for ln in acceptance_raw.splitlines() if ln.strip().startswith("- [")
    ]
    return {
        "goal": parts["goal"],
        "acceptance": acceptance,
        "context": parts["context"],
        "notes": parts["notes"],
    }


def read_task_file(path: Path, column: BoardColumn) -> TaskModel:
    post = frontmatter.load(path)
    meta = dict(post.metadata)
    sections = _parse_sections(post.content)
    filename_slug = path.stem.split("-", 1)[-1] if "-" in path.stem else path.stem
    return TaskModel(
        id=str(meta.get("id", "")),
        slug=filename_slug,
        title=str(meta.get("title", "")),
        status=column,
        priority=meta.get("priority", "P2"),
        assignee=str(meta.get("assignee", "") or ""),
        branch=str(meta.get("branch", "main")),
        created=str(meta.get("created", "")),
        updated=str(meta.get("updated", "")),
        locked_by=str(meta.get("locked_by", "") or ""),
        locked_at=str(meta.get("locked_at", "") or ""),
        lock_expires=str(meta.get("lock_expires", "") or ""),
        tags=list(meta.get("tags") or []),
        related_files=list(meta.get("related_files") or []),
        goal=str(sections["goal"]),
        acceptance=list(sections["acceptance"]),
        context=str(sections["context"]),
        notes=str(sections["notes"]),
    )


def write_task_file(path: Path, task: TaskModel, column: BoardColumn) -> None:
    meta = {
        "id": task.id,
        "title": task.title,
        "status": column,
        "priority": task.priority,
        "assignee": task.assignee,
        "branch": task.branch,
        "created": task.created,
        "updated": task.updated,
        "locked_by": task.locked_by,
        "locked_at": task.locked_at,
        "lock_expires": task.lock_expires,
        "tags": task.tags,
        "related_files": task.related_files,
    }
    acceptance_block = "\n".join(task.acceptance) if task.acceptance else "- [ ] "
    body = f"""## Goal
{task.goal}

## Acceptance
{acceptance_block}

## Context
{task.context}

## Notes
{task.notes}
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    post = frontmatter.Post(body, **meta)
    path.write_text(frontmatter.dumps(post), encoding="utf-8")
