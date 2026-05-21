from __future__ import annotations

from fastapi import APIRouter, Depends

from openkb.api.deps import get_config
from openkb.config import OpenKBConfig
from openkb import doc_service

router = APIRouter(tags=["docs"])


@router.get("/projects/{slug}/docs/{kind}")
def get_doc(slug: str, kind: str, cfg: OpenKBConfig = Depends(get_config)) -> dict:
    return doc_service.read_doc(cfg, slug, kind)


@router.get("/projects/{slug}/decisions")
def list_decisions(slug: str, cfg: OpenKBConfig = Depends(get_config)) -> list[dict]:
    return doc_service.list_decisions(cfg, slug)


@router.get("/projects/{slug}/decisions/{decision_id}")
def get_decision(slug: str, decision_id: str, cfg: OpenKBConfig = Depends(get_config)) -> dict:
    return doc_service.read_decision(cfg, slug, decision_id)
