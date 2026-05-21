from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from openkb.api.routes import board, docs, projects, roadmap, state, tasks, watch
from openkb.errors import LockConflictError, NotFoundError, OpenKBError, ProjectNotFoundError


def create_app() -> FastAPI:
    app = FastAPI(title="OpenKB")

    @app.exception_handler(LockConflictError)
    async def handle_lock_conflict(_request, exc: LockConflictError) -> JSONResponse:
        return JSONResponse(
            status_code=409,
            content={"error": "locked", "owner": exc.owner},
        )

    @app.exception_handler(NotFoundError)
    @app.exception_handler(ProjectNotFoundError)
    async def handle_not_found(_request, exc: Exception) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(OpenKBError)
    async def handle_openkb_error(_request, exc: OpenKBError) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health() -> dict[str, bool]:
        return {"ok": True}

    app.include_router(projects.router, prefix="/api")
    app.include_router(board.router, prefix="/api")
    app.include_router(state.router, prefix="/api")
    app.include_router(tasks.router, prefix="/api")
    app.include_router(docs.router, prefix="/api")
    app.include_router(roadmap.router, prefix="/api")
    app.include_router(watch.router, prefix="/api")

    dist = Path(__file__).resolve().parents[4] / "web" / "dist"
    if dist.is_dir():
        app.mount("/", StaticFiles(directory=dist, html=True), name="static")

    return app


app = create_app()
