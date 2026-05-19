from __future__ import annotations

from fastapi import APIRouter, Depends

from openkb.api.deps import get_config
from openkb.api.schemas import ProjectCreate, ProjectPatch
from openkb.config import OpenKBConfig
from openkb.models import ProjectModel
from openkb.project_service import (
    archive_project,
    create_project,
    list_projects,
    read_project,
    write_project_yaml,
)

router = APIRouter(tags=["projects"])


@router.get("/projects", response_model=list[ProjectModel])
def get_projects(cfg: OpenKBConfig = Depends(get_config)) -> list[ProjectModel]:
    return list_projects(cfg)


@router.post("/projects", response_model=ProjectModel, status_code=201)
def post_project(
    body: ProjectCreate,
    cfg: OpenKBConfig = Depends(get_config),
) -> ProjectModel:
    return create_project(cfg, body.slug, body.name, body.repo_path, body.description)


@router.patch("/projects/{slug}", response_model=ProjectModel)
def patch_project(
    slug: str,
    body: ProjectPatch,
    cfg: OpenKBConfig = Depends(get_config),
) -> ProjectModel:
    if body.status == "archived":
        return archive_project(cfg, slug)

    project = read_project(cfg, slug)
    write_project_yaml(
        cfg.root,
        slug,
        name=body.name if body.name is not None else project.name,
        repo_path=body.repo_path if body.repo_path is not None else project.repo_path,
        description=body.description if body.description is not None else project.description,
        status=body.status if body.status is not None else project.status,
        default_branch=project.default_branch,
        lock_ttl_hours=project.lock_ttl_hours,
        created=project.created,
    )
    return read_project(cfg, slug)
