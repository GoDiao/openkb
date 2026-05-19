from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends

from openkb.api.deps import get_config
from openkb.api.schemas import StatePatch, StateResponse
from openkb.config import OpenKBConfig
from openkb.models import StateModel
from openkb.project_service import read_project
from openkb.state_service import read_state, write_state

router = APIRouter(tags=["state"])


def _state_path(cfg: OpenKBConfig, slug: str):
    return cfg.project_dir(slug) / "STATE.md"


@router.get("/projects/{slug}/state", response_model=StateResponse)
def get_state(slug: str, cfg: OpenKBConfig = Depends(get_config)) -> StateResponse:
    read_project(cfg, slug)
    path = _state_path(cfg, slug)
    if not path.is_file():
        return StateResponse(state=StateModel())
    return StateResponse(state=read_state(path))


@router.patch("/projects/{slug}/state", response_model=StateResponse)
def patch_state(
    slug: str,
    body: StatePatch,
    cfg: OpenKBConfig = Depends(get_config),
) -> StateResponse:
    read_project(cfg, slug)
    path = _state_path(cfg, slug)
    state = read_state(path) if path.is_file() else StateModel()

    if body.now is not None:
        state.now = body.now
    if body.summary is not None:
        state.summary = body.summary
    if body.next_items is not None:
        state.next_items = body.next_items
    if body.recent_done is not None:
        state.recent_done = body.recent_done
    if body.decisions is not None:
        state.decisions = body.decisions
    if body.watch_out is not None:
        state.watch_out = body.watch_out

    state.last_updated = datetime.now().strftime("%Y-%m-%d %H:%M")
    state.updated_by = body.updated_by or "human-ui"
    write_state(path, state, project_slug=slug)
    return StateResponse(state=read_state(path))
