from __future__ import annotations

from fastapi import APIRouter, Depends

from openkb.api.deps import get_config
from openkb.api.schemas import BoardResponse
from openkb.config import OpenKBConfig
from openkb.project_service import read_project
from openkb import task_service

router = APIRouter(tags=["board"])


@router.get("/projects/{slug}/board", response_model=BoardResponse)
def get_board(slug: str, cfg: OpenKBConfig = Depends(get_config)) -> BoardResponse:
    read_project(cfg, slug)
    board = task_service.list_board(cfg, slug)
    return BoardResponse(**board)
