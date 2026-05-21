from __future__ import annotations

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from openkb.config import OpenKBConfig
from openkb.project_service import read_project
from openkb.watch_service import DEFAULT_KINDS, watch_hub

router = APIRouter(tags=["watch"])


class WatchNotifyBody(BaseModel):
    kinds: list[str] | None = None


@router.websocket("/projects/{slug}/watch")
async def watch_project(slug: str, websocket: WebSocket) -> None:
    cfg = OpenKBConfig.load()
    read_project(cfg, slug)
    await websocket.accept()
    queue = await watch_hub.subscribe(slug)
    try:
        while True:
            payload = await queue.get()
            await websocket.send_text(payload)
    except WebSocketDisconnect:
        pass
    finally:
        await watch_hub.unsubscribe(slug, queue)


@router.post("/projects/{slug}/watch/notify")
async def post_watch_notify(slug: str, body: WatchNotifyBody | None = None) -> dict[str, bool]:
    cfg = OpenKBConfig.load()
    read_project(cfg, slug)
    kinds = (body.kinds if body else None) or list(DEFAULT_KINDS)
    await watch_hub.publish(slug, kinds)
    return {"ok": True}
