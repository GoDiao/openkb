from __future__ import annotations

from fastapi import FastAPI

app = FastAPI(title="OpenKB")


@app.get("/api/health")
def health() -> dict[str, bool]:
    return {"ok": True}
