from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

BoardColumn = Literal["backlog", "todo", "doing", "review", "done"]
Priority = Literal["P0", "P1", "P2", "P3"]

_PRIORITY: dict[Priority, int] = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}


def priority_rank(p: Priority) -> int:
    return _PRIORITY[p]


class ProjectModel(BaseModel):
    slug: str
    name: str
    repo_path: str
    description: str = ""
    status: Literal["active", "archived"] = "active"
    default_branch: str = "main"
    lock_ttl_hours: int = 4
    created: str


class TaskModel(BaseModel):
    id: str
    slug: str
    title: str
    status: BoardColumn
    priority: Priority = "P2"
    assignee: str = ""
    branch: str = "main"
    created: str
    updated: str
    locked_by: str = ""
    locked_at: str = ""
    lock_expires: str = ""
    tags: list[str] = Field(default_factory=list)
    related_files: list[str] = Field(default_factory=list)
    goal: str = ""
    acceptance: list[str] = Field(default_factory=list)
    context: str = ""
    notes: str = ""


class StateNow(BaseModel):
    active_task: str = "none"
    owner: str = "—"
    branch: str = "main"
    blocker: str = "none"


class StateModel(BaseModel):
    now: StateNow = Field(default_factory=StateNow)
    summary: str = ""
    next_items: list[str] = Field(default_factory=list)
    recent_done: list[str] = Field(default_factory=list)
    decisions: list[str] = Field(default_factory=list)
    watch_out: list[str] = Field(default_factory=list)
    last_updated: str = ""
    updated_by: str = "system"
