from __future__ import annotations

from openkb.models import BoardColumn, Priority, ProjectModel, StateModel, StateNow, TaskModel
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    slug: str
    name: str
    repo_path: str
    description: str = ""


class ProjectPatch(BaseModel):
    name: str | None = None
    repo_path: str | None = None
    description: str | None = None
    status: str | None = None


class TaskCreate(BaseModel):
    title: str
    priority: Priority = "P2"


class TaskPatch(BaseModel):
    title: str | None = None
    priority: Priority | None = None
    assignee: str | None = None
    branch: str | None = None
    goal: str | None = None
    context: str | None = None
    notes: str | None = None
    tags: list[str] | None = None
    related_files: list[str] | None = None
    acceptance: list[str] | None = None


class TaskMove(BaseModel):
    column: BoardColumn


class CheckoutBody(BaseModel):
    agent_id: str | None = None


class ReleaseBody(BaseModel):
    agent_id: str | None = None


class StatePatch(BaseModel):
    now: StateNow | None = None
    summary: str | None = None
    next_items: list[str] | None = None
    recent_done: list[str] | None = None
    decisions: list[str] | None = None
    watch_out: list[str] | None = None
    updated_by: str | None = None


class BoardResponse(BaseModel):
    backlog: list[TaskModel] = Field(default_factory=list)
    todo: list[TaskModel] = Field(default_factory=list)
    doing: list[TaskModel] = Field(default_factory=list)
    review: list[TaskModel] = Field(default_factory=list)
    done: list[TaskModel] = Field(default_factory=list)


class TaskResponse(BaseModel):
    task: TaskModel


class ProjectResponse(BaseModel):
    project: ProjectModel


class StateResponse(BaseModel):
    state: StateModel
