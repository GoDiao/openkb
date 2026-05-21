from __future__ import annotations

import asyncio
import json
import os
import urllib.error
import urllib.request
from collections import defaultdict
from typing import Any

DEFAULT_KINDS = ("board", "state", "roadmap")


class WatchHub:
    def __init__(self) -> None:
        self._rooms: dict[str, set[asyncio.Queue[str]]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def subscribe(self, slug: str) -> asyncio.Queue[str]:
        queue: asyncio.Queue[str] = asyncio.Queue(maxsize=64)
        async with self._lock:
            self._rooms[slug].add(queue)
        return queue

    async def unsubscribe(self, slug: str, queue: asyncio.Queue[str]) -> None:
        async with self._lock:
            self._rooms[slug].discard(queue)
            if not self._rooms[slug]:
                del self._rooms[slug]

    async def publish(self, slug: str, kinds: list[str] | None = None) -> None:
        payload = json.dumps({"kinds": list(kinds or DEFAULT_KINDS)})
        async with self._lock:
            queues = list(self._rooms.get(slug, ()))
        for queue in queues:
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                pass

    def schedule_publish(self, slug: str, kinds: list[str] | None = None) -> None:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return
        loop.create_task(self.publish(slug, kinds))


watch_hub = WatchHub()


def _serve_base_url() -> str:
    port = os.environ.get("OPENKB_SERVE_PORT", "8788")
    host = os.environ.get("OPENKB_SERVE_HOST", "127.0.0.1")
    return f"http://{host}:{port}"


def _http_notify(slug: str, kinds: list[str] | None = None) -> None:
    url = f"{_serve_base_url()}/api/projects/{slug}/watch/notify"
    body = json.dumps({"kinds": list(kinds or DEFAULT_KINDS)}).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=0.4) as response:
            response.read()
    except (urllib.error.URLError, TimeoutError, OSError):
        pass


def notify_project_change(slug: str, kinds: list[str] | None = None) -> None:
    """Broadcast to in-process WebSocket clients and running serve process (CLI path)."""
    kinds_list = list(kinds or DEFAULT_KINDS)
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(watch_hub.publish(slug, kinds_list))
    except RuntimeError:
        try:
            asyncio.run(watch_hub.publish(slug, kinds_list))
        except RuntimeError:
            pass
    _http_notify(slug, kinds_list)
