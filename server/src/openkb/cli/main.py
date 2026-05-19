from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import typer

from openkb.cli.utils import get_agent_id
from openkb.config import OpenKBConfig
from openkb.errors import LockConflictError, NotFoundError, OpenKBError, ProjectNotFoundError
from openkb.models import Priority, TaskModel
from openkb.project_resolver import resolve_project_slug
from openkb.project_service import list_projects, read_project
from openkb.state_service import read_state
from openkb import task_service

app = typer.Typer(no_args_is_help=True)
task_app = typer.Typer(no_args_is_help=True)
project_app = typer.Typer(no_args_is_help=True)
app.add_typer(task_app, name="task")
app.add_typer(project_app, name="project")


def _parse_iso(value: str) -> datetime | None:
    if not value:
        return None
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _is_lock_valid(task: TaskModel) -> bool:
    if not task.locked_by:
        return False
    expires = _parse_iso(task.lock_expires)
    if expires is None:
        return True
    return expires > datetime.now(timezone.utc)


def _task_to_dict(task: TaskModel) -> dict[str, Any]:
    return task.model_dump()


def _emit(payload: Any, json_output: bool, human: str | None = None) -> None:
    if json_output:
        typer.echo(json.dumps(payload, ensure_ascii=False))
    elif human:
        typer.echo(human)


def _emit_error(message: str, json_output: bool, *, code: int = 1, payload: dict[str, Any] | None = None) -> None:
    if json_output:
        typer.echo(json.dumps(payload or {"error": message}, ensure_ascii=False))
    else:
        typer.echo(message, err=True)
    raise typer.Exit(code)


def _handle_cli_error(exc: Exception, json_output: bool) -> None:
    if isinstance(exc, LockConflictError):
        _emit_error(
            str(exc),
            json_output,
            code=2,
            payload={"error": "locked", "owner": exc.owner},
        )
    if isinstance(exc, ProjectNotFoundError):
        _emit_error(str(exc), json_output)
    if isinstance(exc, NotFoundError):
        _emit_error(str(exc), json_output)
    if isinstance(exc, OpenKBError):
        _emit_error(str(exc), json_output)
    _emit_error(str(exc), json_output)


def _resolve_slug(project: str | None = None) -> str:
    if project:
        return project
    return resolve_project_slug(Path.cwd())


def _checked_out_by_me(cfg: OpenKBConfig, slug: str, agent_id: str) -> bool:
    board = task_service.list_board(cfg, slug)
    for task in board["doing"]:
        if task.locked_by == agent_id and _is_lock_valid(task):
            return True
    return False


def _state_payload(cfg: OpenKBConfig, slug: str) -> dict[str, Any]:
    state_path = cfg.project_dir(slug) / "STATE.md"
    state = read_state(state_path) if state_path.is_file() else None
    if state is None:
        return {
            "active_task": "none",
            "owner": "—",
            "branch": "main",
            "summary": "",
            "next": [],
            "blocker": None,
        }
    blocker = state.now.blocker
    return {
        "active_task": state.now.active_task,
        "owner": state.now.owner,
        "branch": state.now.branch,
        "summary": state.summary,
        "next": state.next_items,
        "blocker": None if blocker in ("none", "—", "") else blocker,
    }


def _find_slug_for_cwd(cfg: OpenKBConfig, cwd: Path) -> str | None:
    resolved_cwd = cwd.resolve()
    for project in list_projects(cfg):
        repo = Path(project.repo_path).resolve()
        if sys.platform == "win32":
            if str(resolved_cwd).lower() == str(repo).lower():
                return project.slug
        elif resolved_cwd == repo:
            return project.slug
    return None


@app.command()
def context(
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project", help="Project slug override"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        proj = read_project(cfg, slug)
        agent_id = get_agent_id()
        payload = {
            "project": slug,
            "repo_path": proj.repo_path,
            "state": _state_payload(cfg, slug),
            "checked_out_by_me": _checked_out_by_me(cfg, slug, agent_id),
        }
        if json_output:
            _emit(payload, True)
        else:
            state = payload["state"]
            typer.echo(f"Project: {slug}")
            typer.echo(f"Repo: {proj.repo_path}")
            typer.echo(f"Active: {state['active_task']} ({state['owner']})")
            if state["summary"]:
                typer.echo(f"Summary: {state['summary']}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@app.command()
def next(
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        agent_id = get_agent_id()
        task = task_service.next_task(cfg, slug, agent_id)
        payload = {"task": _task_to_dict(task) if task else None}
        if json_output:
            _emit(payload, True)
        elif task:
            typer.echo(f"{task.id} {task.title} [{task.priority}]")
        else:
            typer.echo("No available tasks.")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@app.command()
def checkout(
    task_id: str,
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        agent_id = get_agent_id()
        task = task_service.checkout(cfg, slug, task_id, agent_id)
        payload = {"task": _task_to_dict(task)}
        if json_output:
            _emit(payload, True)
        else:
            typer.echo(f"Checked out {task.id}: {task.title}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@app.command()
def release(
    task_id: str,
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        agent_id = get_agent_id()
        task = task_service.release(cfg, slug, task_id, agent_id)
        payload = {"task": _task_to_dict(task)}
        if json_output:
            _emit(payload, True)
        else:
            typer.echo(f"Released {task.id}: {task.title}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@app.command()
def done(
    task_id: str,
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        agent_id = get_agent_id()
        task = task_service.done(cfg, slug, task_id, agent_id)
        payload = {"task": _task_to_dict(task)}
        if json_output:
            _emit(payload, True)
        else:
            typer.echo(f"Done {task.id}: {task.title}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@app.command()
def note(
    task_id: str,
    text: str,
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        task = task_service.append_note(cfg, slug, task_id, text)
        payload = {"task": _task_to_dict(task)}
        if json_output:
            _emit(payload, True)
        else:
            typer.echo(f"Note added to {task.id}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@app.command(name="check")
def check_item(
    task_id: str,
    index: int,
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        task = task_service.toggle_acceptance(cfg, slug, task_id, index)
        payload = {"task": _task_to_dict(task)}
        if json_output:
            _emit(payload, True)
        else:
            item = task.acceptance[index - 1]
            typer.echo(f"{task.id} item {index}: {item}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@app.command()
def status(
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        board = task_service.list_board(cfg, slug)
        payload = {col: [_task_to_dict(t) for t in tasks] for col, tasks in board.items()}
        if json_output:
            _emit(payload, True)
        else:
            for col, tasks in board.items():
                typer.echo(f"[{col}] {len(tasks)}")
                for task in tasks:
                    lock = f" 🔒{task.locked_by}" if task.locked_by else ""
                    typer.echo(f"  {task.id} {task.title} [{task.priority}]{lock}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@task_app.command("create")
def task_create(
    title: str = typer.Option(..., "--title"),
    priority: Priority = typer.Option("P2", "--priority"),
    project: str | None = typer.Option(None, "--project"),
    json_output: bool = typer.Option(False, "--json"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        task = task_service.create_task(cfg, slug, title, priority=priority)
        payload = {"task": _task_to_dict(task)}
        if json_output:
            _emit(payload, True)
        else:
            typer.echo(f"Created {task.id}: {task.title}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@project_app.command("list")
def project_list(
    json_output: bool = typer.Option(False, "--json"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        projects = list_projects(cfg)
        payload = {"projects": [p.model_dump() for p in projects]}
        if json_output:
            _emit(payload, True)
        else:
            for project in projects:
                typer.echo(f"{project.slug}\t{project.name}\t{project.status}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@project_app.command("link")
def project_link(
    slug: str | None = typer.Option(None, "--slug"),
    json_output: bool = typer.Option(False, "--json"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        cwd = Path.cwd()
        resolved_slug = slug or _find_slug_for_cwd(cfg, cwd)
        if not resolved_slug:
            _emit_error(
                "No matching project for this directory. Use --slug.",
                json_output,
            )
        read_project(cfg, resolved_slug)
        link_path = cwd / ".openkb-link"
        link_path.write_text(f"{resolved_slug}\n", encoding="utf-8")
        payload = {"slug": resolved_slug, "path": str(link_path)}
        if json_output:
            _emit(payload, True)
        else:
            typer.echo(f"Linked {resolved_slug} -> {link_path}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@app.command()
def serve(
    port: int = typer.Option(8787, "--port"),
    json_output: bool = typer.Option(False, "--json"),
) -> None:
    import uvicorn

    if json_output:
        _emit({"host": "127.0.0.1", "port": port}, True)
    uvicorn.run("openkb.api.app:app", host="127.0.0.1", port=port, reload=False)


if __name__ == "__main__":
    app()
