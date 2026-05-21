from __future__ import annotations

from pathlib import Path

import yaml

from openkb.config import OpenKBConfig
from openkb.errors import NotFoundError
from openkb.project_service import read_project

DocKind = str  # "spec" | "plan"


def resolve_doc_path(cfg: OpenKBConfig, repo_path: str, rel: str) -> Path:
    if not rel:
        raise NotFoundError("Doc path is empty")
    rel_path = Path(rel)
    candidates = [
        Path(repo_path).resolve() / rel_path,
        cfg.root.resolve() / rel_path,
    ]
    for path in candidates:
        if path.is_file():
            return path
    raise NotFoundError(f"Doc file not found: {rel}")


def doc_status(cfg: OpenKBConfig, slug: str) -> dict[str, dict[str, str | bool]]:
    project = read_project(cfg, slug)
    out: dict[str, dict[str, str | bool]] = {}
    for kind, rel in (("spec", project.docs.spec), ("plan", project.docs.plan)):
        if not rel:
            out[kind] = {"path": "", "configured": False, "exists": False}
            continue
        try:
            resolve_doc_path(cfg, project.repo_path, rel)
            out[kind] = {"path": rel.replace("\\", "/"), "configured": True, "exists": True}
        except NotFoundError:
            out[kind] = {"path": rel.replace("\\", "/"), "configured": True, "exists": False}
    return out


def read_doc(cfg: OpenKBConfig, slug: str, kind: DocKind) -> dict[str, str]:
    project = read_project(cfg, slug)
    rel = ""
    if kind == "spec":
        rel = project.docs.spec
    elif kind == "plan":
        rel = project.docs.plan
    else:
        raise NotFoundError(f"Unknown doc kind: {kind}")

    if not rel:
        raise NotFoundError(f"No {kind} path configured for project {slug}")

    path = resolve_doc_path(cfg, project.repo_path, rel)

    return {
        "kind": kind,
        "path": rel.replace("\\", "/"),
        "content": path.read_text(encoding="utf-8"),
    }


def list_decisions(cfg: OpenKBConfig, slug: str) -> list[dict[str, object]]:
    read_project(cfg, slug)
    decisions_dir = cfg.project_dir(slug) / "decisions"
    if not decisions_dir.is_dir():
        return []
    items: list[dict[str, object]] = []
    for f in sorted(decisions_dir.glob("D*.md")):
        meta = _parse_decision_file(f)
        items.append(
            {
                "id": f.stem,
                "path": str(f.relative_to(cfg.project_dir(slug))).replace("\\", "/"),
                "title": meta["title"],
                "phases": meta["phases"],
            }
        )
    return items


def read_decision(cfg: OpenKBConfig, slug: str, decision_id: str) -> dict[str, object]:
    read_project(cfg, slug)
    path = cfg.project_dir(slug) / "decisions" / f"{decision_id}.md"
    if not path.is_file():
        raise NotFoundError(f"Decision not found: {decision_id}")
    meta = _parse_decision_file(path)
    return {
        "id": decision_id,
        "path": f"decisions/{decision_id}.md",
        "title": meta["title"],
        "phases": meta["phases"],
        "content": path.read_text(encoding="utf-8"),
    }


def _parse_decision_file(path: Path) -> dict[str, object]:
    text = path.read_text(encoding="utf-8")
    title = path.stem
    phases: list[str] = []
    body = text

    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            meta = yaml.safe_load(parts[1]) or {}
            if isinstance(meta, dict) and isinstance(meta.get("phases"), list):
                phases = [str(p) for p in meta["phases"]]
            body = parts[2]

    for line in body.splitlines():
        if line.startswith("# "):
            title = line[2:].strip()
            break

    return {"title": title, "phases": phases}


def _decision_title(path: Path) -> str:
    return str(_parse_decision_file(path)["title"])
