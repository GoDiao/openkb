from __future__ import annotations

from fastapi import APIRouter, Depends

from openkb.api.deps import get_config
from openkb.api.schemas import CheckoutBody, ReleaseBody, TaskCreate, TaskMove, TaskPatch, TaskResponse
from openkb.config import OpenKBConfig
from openkb.project_service import read_project
from openkb import task_service

router = APIRouter(tags=["tasks"])


@router.get("/projects/{slug}/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    slug: str,
    task_id: str,
    cfg: OpenKBConfig = Depends(get_config),
) -> TaskResponse:
    read_project(cfg, slug)
    return TaskResponse(task=task_service.get_task(cfg, slug, task_id))


@router.post("/projects/{slug}/tasks", response_model=TaskResponse, status_code=201)
def post_task(
    slug: str,
    body: TaskCreate,
    cfg: OpenKBConfig = Depends(get_config),
) -> TaskResponse:
    read_project(cfg, slug)
    task = task_service.create_task(cfg, slug, body.title, priority=body.priority)
    return TaskResponse(task=task)


@router.patch("/projects/{slug}/tasks/{task_id}", response_model=TaskResponse)
def patch_task(
    slug: str,
    task_id: str,
    body: TaskPatch,
    cfg: OpenKBConfig = Depends(get_config),
) -> TaskResponse:
    read_project(cfg, slug)
    task = task_service.update_task(cfg, slug, task_id, **body.model_dump(exclude_unset=True))
    return TaskResponse(task=task)


@router.post("/projects/{slug}/tasks/{task_id}/move", response_model=TaskResponse)
def move_task(
    slug: str,
    task_id: str,
    body: TaskMove,
    cfg: OpenKBConfig = Depends(get_config),
) -> TaskResponse:
    read_project(cfg, slug)
    task = task_service.move_task(cfg, slug, task_id, body.column)
    return TaskResponse(task=task)


@router.post("/projects/{slug}/tasks/{task_id}/checkout", response_model=TaskResponse)
def checkout_task(
    slug: str,
    task_id: str,
    body: CheckoutBody,
    cfg: OpenKBConfig = Depends(get_config),
) -> TaskResponse:
    read_project(cfg, slug)
    agent_id = body.agent_id or "human-ui"
    task = task_service.checkout(cfg, slug, task_id, agent_id)
    return TaskResponse(task=task)


@router.post("/projects/{slug}/tasks/{task_id}/release", response_model=TaskResponse)
def release_task(
    slug: str,
    task_id: str,
    body: ReleaseBody,
    cfg: OpenKBConfig = Depends(get_config),
) -> TaskResponse:
    read_project(cfg, slug)
    agent_id = body.agent_id or "human-ui"
    task = task_service.release(cfg, slug, task_id, agent_id)
    return TaskResponse(task=task)
