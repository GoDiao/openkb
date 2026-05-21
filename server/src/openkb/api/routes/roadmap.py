from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from openkb.api.deps import get_config
from openkb.config import OpenKBConfig
from openkb.models import RoadmapModel
from openkb import roadmap_service

router = APIRouter(tags=["roadmap"])


class TaskDetail(BaseModel):
    id: str
    title: str
    status: str
    priority: str = "P2"


class DecisionDetail(BaseModel):
    id: str
    title: str


class EnrichedPhase(BaseModel):
    id: str
    title: str
    status: str
    depends_on: list[str] = Field(default_factory=list)
    plan_ref: str = ""
    tasks: list[str] = Field(default_factory=list)
    decisions: list[str] = Field(default_factory=list)
    task_details: list[TaskDetail] = Field(default_factory=list)
    decision_details: list[DecisionDetail] = Field(default_factory=list)
    plan_anchor: str = ""


class RoadmapResponse(BaseModel):
    roadmap: RoadmapModel
    enriched_phases: list[EnrichedPhase]
    phase_depths: dict[str, int]
    mermaid: str
    progress: dict[str, int | float]


@router.get("/projects/{slug}/roadmap", response_model=RoadmapResponse)
def get_roadmap(slug: str, cfg: OpenKBConfig = Depends(get_config)) -> RoadmapResponse:
    payload = roadmap_service.roadmap_payload(cfg, slug)
    roadmap = roadmap_service.read_roadmap(cfg, slug)
    return RoadmapResponse(
        roadmap=roadmap,
        enriched_phases=payload["enriched_phases"],
        phase_depths=payload["phase_depths"],
        mermaid=payload["mermaid"],
        progress=payload["progress"],
    )
