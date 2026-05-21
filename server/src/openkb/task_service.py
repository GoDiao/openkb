from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

from openkb.config import OpenKBConfig
from openkb.errors import DeleteForbiddenError, LockConflictError, NotFoundError
from openkb.markdown_io import read_task_file, write_task_file
from openkb.models import (
    BoardColumn,
    Priority,
    StateModel,
    StateNow,
    TaskModel,
    priority_rank,
)
from openkb.project_service import BOARD_COLUMNS, read_project
from openkb.roadmap_service import maybe_complete_phases_for_task
from openkb.session_service import append_session
from openkb.state_service import read_state, write_state
from openkb.watch_service import notify_project_change

_SCAN_COLUMNS: tuple[BoardColumn, ...] = ("backlog", "todo", "doing", "review")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse_iso(value: str) -> datetime | None:
    if not value:
        return None
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug or "task"


def _task_key(task: TaskModel) -> str:
    return f"{task.id}-{task.slug}"


def _find_task_path(pdir: Path, task_id: str) -> tuple[Path, BoardColumn]:
    prefix = f"{task_id}-"
    for col in BOARD_COLUMNS:
        col_dir = pdir / "board" / col
        if not col_dir.is_dir():
            continue
        for path in col_dir.glob("*.md"):
            if path.stem == task_id or path.stem.startswith(prefix):
                return path, col
    raise NotFoundError(f"Task not found: {task_id}")


def _next_task_id(pdir: Path) -> str:
    max_id = 0
    for col in BOARD_COLUMNS:
        col_dir = pdir / "board" / col
        if not col_dir.is_dir():
            continue
        for path in col_dir.glob("*.md"):
            head = path.stem.split("-", 1)[0]
            if head.isdigit():
                max_id = max(max_id, int(head))
    return f"{max_id + 1:03d}"


def _is_lock_valid(task: TaskModel, now: datetime | None = None) -> bool:
    if not task.locked_by:
        return False
    expires = _parse_iso(task.lock_expires)
    if expires is None:
        return True
    current = now or _utc_now()
    return expires > current


def _load_task(path: Path, column: BoardColumn) -> TaskModel:
    return read_task_file(path, column=column)


def _save_task(path: Path, task: TaskModel, column: BoardColumn) -> None:
    write_task_file(path, task, column=column)


def _move_task_file(
    pdir: Path,
    path: Path,
    from_col: BoardColumn,
    to_col: BoardColumn,
    task: TaskModel,
) -> Path:
    dest_dir = pdir / "board" / to_col
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / path.name
    _save_task(dest, task, column=to_col)
    if dest.resolve() != path.resolve():
        path.unlink(missing_ok=True)
    return dest


def _state_path(cfg: OpenKBConfig, slug: str) -> Path:
    return cfg.project_dir(slug) / "STATE.md"


def _touch_state(
    cfg: OpenKBConfig,
    slug: str,
    *,
    now: StateNow | None = None,
    recent_entry: str | None = None,
    advance_next: bool = False,
    agent_id: str,
) -> str | None:
    path = _state_path(cfg, slug)
    state = read_state(path) if path.is_file() else StateModel()
    removed_next: str | None = None
    if now is not None:
        state.now = now
    if recent_entry:
        state.recent_done = [recent_entry, *state.recent_done][:5]
    if advance_next and state.next_items:
        removed_next = state.next_items.pop(0)
    state.last_updated = _utc_now().strftime("%Y-%m-%d %H:%M")
    state.updated_by = agent_id
    write_state(path, state, project_slug=slug)
    return removed_next


def list_board(cfg: OpenKBConfig, slug: str) -> dict[BoardColumn, list[TaskModel]]:
    pdir = cfg.project_dir(slug)
    board: dict[BoardColumn, list[TaskModel]] = {col: [] for col in BOARD_COLUMNS}
    for col in BOARD_COLUMNS:
        col_dir = pdir / "board" / col
        if not col_dir.is_dir():
            continue
        tasks = [_load_task(p, col) for p in sorted(col_dir.glob("*.md"))]
        board[col] = sorted(tasks, key=lambda t: (priority_rank(t.priority), t.id))
    return board


def get_task(cfg: OpenKBConfig, slug: str, task_id: str) -> TaskModel:
    path, col = _find_task_path(cfg.project_dir(slug), task_id)
    return _load_task(path, col)


def create_task(
    cfg: OpenKBConfig,
    slug: str,
    title: str,
    priority: Priority = "P2",
) -> TaskModel:
    pdir = cfg.project_dir(slug)
    task_id = _next_task_id(pdir)
    slug_part = _slugify(title)
    now = _iso(_utc_now())
    task = TaskModel(
        id=task_id,
        slug=slug_part,
        title=title,
        status="backlog",
        priority=priority,
        created=now[:10],
        updated=now,
    )
    path = pdir / "board" / "backlog" / f"{task_id}-{slug_part}.md"
    _save_task(path, task, column="backlog")
    notify_project_change(slug, ["board"])
    return task


def move_task(
    cfg: OpenKBConfig,
    slug: str,
    task_id: str,
    column: BoardColumn,
) -> TaskModel:
    pdir = cfg.project_dir(slug)
    path, from_col = _find_task_path(pdir, task_id)
    task = _load_task(path, from_col)
    task.status = column
    task.updated = _iso(_utc_now())
    dest = _move_task_file(pdir, path, from_col, column, task)
    notify_project_change(slug, ["board"])
    return _load_task(dest, column)


def checkout(
    cfg: OpenKBConfig,
    slug: str,
    task_id: str,
    agent_id: str,
) -> TaskModel:
    project = read_project(cfg, slug)
    pdir = cfg.project_dir(slug)
    path, col = _find_task_path(pdir, task_id)
    task = _load_task(path, col)
    now = _utc_now()

    if _is_lock_valid(task, now) and task.locked_by != agent_id:
        raise LockConflictError(task.locked_by)

    if task.locked_by and task.locked_by != agent_id:
        note = (
            f"\n\n---\n"
            f"Lock takeover from {task.locked_by} at {_iso(now)} by {agent_id}."
        )
        task.notes = (task.notes or "").rstrip() + note

    expires = now + timedelta(hours=project.lock_ttl_hours)
    task.locked_by = agent_id
    task.locked_at = _iso(now)
    task.lock_expires = _iso(expires)
    task.assignee = agent_id
    task.updated = _iso(now)
    task.status = "doing"

    dest = _move_task_file(pdir, path, col, "doing", task)
    _touch_state(
        cfg,
        slug,
        now=StateNow(
            active_task=_task_key(task),
            owner=agent_id,
            branch=task.branch,
            blocker="none",
        ),
        agent_id=agent_id,
    )
    notify_project_change(slug, ["board", "state"])
    return _load_task(dest, "doing")


def release(
    cfg: OpenKBConfig,
    slug: str,
    task_id: str,
    agent_id: str,
) -> TaskModel:
    pdir = cfg.project_dir(slug)
    path, col = _find_task_path(pdir, task_id)
    task = _load_task(path, col)
    if task.locked_by and task.locked_by != agent_id:
        raise LockConflictError(task.locked_by)

    now = _utc_now()
    task.locked_by = ""
    task.locked_at = ""
    task.lock_expires = ""
    task.updated = _iso(now)
    task.status = "todo"
    dest = _move_task_file(pdir, path, col, "todo", task)

    append_session(
        pdir,
        agent_id,
        task_id,
        "release",
        f"Released task {task.title}.",
    )
    _touch_state(
        cfg,
        slug,
        now=StateNow(),
        agent_id=agent_id,
    )
    notify_project_change(slug, ["board", "state"])
    return _load_task(dest, "todo")


@dataclass
class DoneOutcome:
    task: TaskModel
    removed_next_item: str | None = None
    phases_completed: list[str] = field(default_factory=list)
    phases_activated: list[str] = field(default_factory=list)


def done(
    cfg: OpenKBConfig,
    slug: str,
    task_id: str,
    agent_id: str,
) -> DoneOutcome:
    pdir = cfg.project_dir(slug)
    path, col = _find_task_path(pdir, task_id)
    task = _load_task(path, col)
    if task.locked_by and task.locked_by != agent_id:
        raise LockConflictError(task.locked_by)

    now = _utc_now()
    task.locked_by = ""
    task.locked_at = ""
    task.lock_expires = ""
    task.updated = _iso(now)
    task.status = "done"
    dest = _move_task_file(pdir, path, col, "done", task)

    today = now.strftime("%Y-%m-%d")
    recent_entry = f"- [x] {today} {task.title}"
    append_session(
        pdir,
        agent_id,
        task_id,
        "done",
        f"Completed task {task.title}.",
    )
    removed_next = _touch_state(
        cfg,
        slug,
        now=StateNow(),
        recent_entry=recent_entry,
        advance_next=True,
        agent_id=agent_id,
    )

    board = list_board(cfg, slug)
    done_ids = {t.id for t in board["done"]}
    roadmap_advance = maybe_complete_phases_for_task(
        cfg,
        slug,
        task_id,
        done_task_ids=done_ids,
    )

    notify_project_change(slug, ["board", "state", "roadmap"])

    return DoneOutcome(
        task=_load_task(dest, "done"),
        removed_next_item=removed_next,
        phases_completed=roadmap_advance.phases_completed,
        phases_activated=roadmap_advance.phases_activated,
    )


def _is_available(task: TaskModel, agent_id: str, now: datetime) -> bool:
    if task.status == "doing" and _is_lock_valid(task, now):
        return False
    return True


def update_task(
    cfg: OpenKBConfig,
    slug: str,
    task_id: str,
    **fields: object,
) -> TaskModel:
    pdir = cfg.project_dir(slug)
    path, col = _find_task_path(pdir, task_id)
    task = _load_task(path, col)
    for key, value in fields.items():
        if value is not None and hasattr(task, key):
            setattr(task, key, value)
    task.updated = _iso(_utc_now())
    _save_task(path, task, col)
    notify_project_change(slug, ["board"])
    return _load_task(path, col)


def delete_task(
    cfg: OpenKBConfig,
    slug: str,
    task_id: str,
    agent_id: str,
    *,
    force: bool = False,
) -> None:
    pdir = cfg.project_dir(slug)
    path, col = _find_task_path(pdir, task_id)
    task = _load_task(path, col)
    if col == "done" and not force:
        raise DeleteForbiddenError("Cannot delete done task without --force")
    if task.locked_by and _is_lock_valid(task) and task.locked_by != agent_id:
        raise LockConflictError(task.locked_by)
    path.unlink(missing_ok=True)
    notify_project_change(slug, ["board"])


def append_note(
    cfg: OpenKBConfig,
    slug: str,
    task_id: str,
    text: str,
) -> TaskModel:
    pdir = cfg.project_dir(slug)
    path, col = _find_task_path(pdir, task_id)
    task = _load_task(path, col)
    now = _iso(_utc_now())
    if task.notes:
        task.notes = task.notes.rstrip() + f"\n\n{text}"
    else:
        task.notes = text
    task.updated = now
    _save_task(path, task, col)
    return task


def toggle_acceptance(
    cfg: OpenKBConfig,
    slug: str,
    task_id: str,
    index: int,
) -> TaskModel:
    pdir = cfg.project_dir(slug)
    path, col = _find_task_path(pdir, task_id)
    task = _load_task(path, col)
    if index < 1 or index > len(task.acceptance):
        raise NotFoundError(f"Acceptance item {index} not found")
    item = task.acceptance[index - 1]
    if re.match(r"^- \[[xX]\]", item):
        task.acceptance[index - 1] = re.sub(r"^- \[[xX]\]", "- [ ]", item, count=1)
    elif re.match(r"^- \[ \]", item):
        task.acceptance[index - 1] = re.sub(r"^- \[ \]", "- [x]", item, count=1)
    else:
        raise NotFoundError(f"Invalid acceptance item at index {index}")
    task.updated = _iso(_utc_now())
    _save_task(path, task, col)
    return task


def next_task(cfg: OpenKBConfig, slug: str, agent_id: str) -> TaskModel | None:
    board = list_board(cfg, slug)
    now = _utc_now()
    candidates: list[TaskModel] = []
    for col in _SCAN_COLUMNS:
        for task in board[col]:
            if _is_available(task, agent_id, now):
                candidates.append(task)
    if not candidates:
        return None
    candidates.sort(key=lambda t: (priority_rank(t.priority), t.id))
    return candidates[0]
