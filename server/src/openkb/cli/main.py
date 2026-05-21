from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import typer

from openkb.cli.console import cli_echo, ensure_stdio_utf8
from openkb.cli.utils import get_agent_id
from openkb.config import OpenKBConfig
from openkb.errors import LockConflictError, NotFoundError, OpenKBError, ProjectNotFoundError
from openkb.models import PhaseStatus, Priority, StateModel, TaskModel
from openkb.project_resolver import resolve_project_slug
from openkb.project_service import list_projects, read_project, update_project_docs
from openkb.project_templates import compute_project_pending, create_project_scaffold
from openkb.roadmap_service import complete_phase, roadmap_payload, set_phase_status
from openkb import doc_service
from openkb import agent_patch_service
from openkb.state_service import patch_state_fields, read_state, write_state
from openkb import task_service

app = typer.Typer(no_args_is_help=True)
task_app = typer.Typer(no_args_is_help=True)
project_app = typer.Typer(no_args_is_help=True)
roadmap_app = typer.Typer(no_args_is_help=True)
state_app = typer.Typer(no_args_is_help=True)
doc_app = typer.Typer(no_args_is_help=True)
agent_app = typer.Typer(no_args_is_help=True, help="Patch OpenKB onboarding into coding agent AGENTS.md / CLAUDE.md")
app.add_typer(task_app, name="task")
app.add_typer(project_app, name="project")
app.add_typer(roadmap_app, name="roadmap")
app.add_typer(state_app, name="state")
app.add_typer(doc_app, name="doc")
app.add_typer(agent_app, name="agent")


@app.callback()
def _cli_bootstrap() -> None:
    ensure_stdio_utf8()


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
        cli_echo(json.dumps(payload, ensure_ascii=False))
    elif human:
        cli_echo(human)


def _emit_error(message: str, json_output: bool, *, code: int = 1, payload: dict[str, Any] | None = None) -> None:
    if json_output:
        cli_echo(json.dumps(payload or {"error": message}, ensure_ascii=False))
    else:
        cli_echo(message, err=True)
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
            "docs": doc_service.doc_status(cfg, slug),
            "state": _state_payload(cfg, slug),
            "roadmap": roadmap_payload(cfg, slug),
            "checked_out_by_me": _checked_out_by_me(cfg, slug, agent_id),
        }
        if json_output:
            _emit(payload, True)
        else:
            state = payload["state"]
            cli_echo(f"Project: {slug}")
            cli_echo(f"Repo: {proj.repo_path}")
            cli_echo(f"Active: {state['active_task']} ({state['owner']})")
            if state["summary"]:
                cli_echo(f"Summary: {state['summary']}")
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
            cli_echo(f"{task.id} {task.title} [{task.priority}]")
        else:
            cli_echo("No available tasks.")
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
            cli_echo(f"Checked out {task.id}: {task.title}")
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
            cli_echo(f"Released {task.id}: {task.title}")
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
        outcome = task_service.done(cfg, slug, task_id, agent_id)
        payload = {
            "task": _task_to_dict(outcome.task),
            "removed_next_item": outcome.removed_next_item,
            "phases_completed": outcome.phases_completed,
            "phases_activated": outcome.phases_activated,
        }
        if json_output:
            _emit(payload, True)
        else:
            cli_echo(f"Done {outcome.task.id}: {outcome.task.title}")
            if outcome.removed_next_item:
                cli_echo(f"Next advanced: removed «{outcome.removed_next_item}»")
            if outcome.phases_completed:
                cli_echo(f"Roadmap completed: {', '.join(outcome.phases_completed)}")
            if outcome.phases_activated:
                cli_echo(f"Roadmap activated: {', '.join(outcome.phases_activated)}")
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
            cli_echo(f"Note added to {task.id}")
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
            cli_echo(f"{task.id} item {index}: {item}")
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
                cli_echo(f"[{col}] {len(tasks)}")
                for task in tasks:
                    lock = f" 🔒{task.locked_by}" if task.locked_by else ""
                    cli_echo(f"  {task.id} {task.title} [{task.priority}]{lock}")
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
            cli_echo(f"Created {task.id}: {task.title}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@task_app.command("delete")
def task_delete(
    task_id: str,
    force: bool = typer.Option(False, "--force", help="Allow deleting done tasks"),
    project: str | None = typer.Option(None, "--project"),
    json_output: bool = typer.Option(False, "--json"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        agent_id = get_agent_id()
        task_service.delete_task(cfg, slug, task_id, agent_id, force=force)
        payload = {"deleted": task_id, "force": force}
        if json_output:
            _emit(payload, True)
        else:
            cli_echo(f"Deleted task {task_id}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@project_app.command("create")
def project_create(
    slug: str = typer.Option(..., "--slug"),
    name: str = typer.Option(..., "--name"),
    repo_path: str = typer.Option(..., "--repo-path", help="Business repo root; created if missing"),
    description: str = typer.Option("", "--description"),
    spec_path: str = typer.Option("docs/spec.md", "--spec-path"),
    plan_path: str = typer.Option("docs/plan.md", "--plan-path"),
    link: bool = typer.Option(False, "--link", help="Write .openkb-link in cwd when cwd matches repo_path"),
    no_repo_templates: bool = typer.Option(False, "--no-repo-templates"),
    json_output: bool = typer.Option(False, "--json"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        result = create_project_scaffold(
            cfg,
            slug,
            name,
            repo_path,
            description=description,
            spec_rel=spec_path,
            plan_rel=plan_path,
            write_repo_templates=not no_repo_templates,
        )
        link_path: str | None = None
        if link:
            cwd = Path.cwd().resolve()
            target = Path(repo_path).resolve()
            same = (
                str(cwd).lower() == str(target).lower()
                if sys.platform == "win32"
                else cwd == target
            )
            if same:
                lp = cwd / ".openkb-link"
                lp.write_text(f"{slug}\n", encoding="utf-8")
                link_path = str(lp)

        payload = {
            "slug": result.slug,
            "repo_path": result.repo_path,
            "created_files": result.created_files,
            "pending": result.pending,
            "link": link_path,
            "project": read_project(cfg, slug).model_dump(),
        }
        if json_output:
            _emit(payload, True)
        else:
            cli_echo(f"Created project {slug} ({name})")
            cli_echo(f"Repo: {result.repo_path}")
            cli_echo("Pending items:")
            for item in result.pending:
                cli_echo(f"  [{item['status']}] {item['id']}: {item['action']}")
            if link_path:
                cli_echo(f"Linked: {link_path}")
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
                cli_echo(f"{project.slug}\t{project.name}\t{project.status}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@project_app.command("show")
def project_show(
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        proj = read_project(cfg, slug)
        payload = {
            "project": proj.model_dump(),
            "docs": doc_service.doc_status(cfg, slug),
            "pending": compute_project_pending(cfg, slug),
        }
        if json_output:
            _emit(payload, True)
        else:
            cli_echo(f"{proj.slug}: {proj.name}")
            cli_echo(f"Repo: {proj.repo_path}")
            for kind, info in payload["docs"].items():
                cli_echo(f"  {kind}: {info['path'] or '(not configured)'} exists={info['exists']}")
            if payload["pending"]:
                cli_echo("Pending:")
                for item in payload["pending"]:
                    cli_echo(f"  [{item['status']}] {item['id']}: {item['action']}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@project_app.command("set-docs")
def project_set_docs(
    spec: str | None = typer.Option(None, "--spec", help="Spec path, relative to repo_path"),
    plan: str | None = typer.Option(None, "--plan", help="Plan path, relative to repo_path"),
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        if spec is None and plan is None:
            _emit_error("Provide at least one of --spec or --plan.", json_output)
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        proj = update_project_docs(cfg, slug, spec=spec, plan=plan)
        payload = {
            "project": proj.model_dump(),
            "docs": doc_service.doc_status(cfg, slug),
        }
        if json_output:
            _emit(payload, True)
        else:
            cli_echo(f"Updated docs for {slug}.")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@doc_app.command("spec")
def doc_spec(
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        payload = doc_service.read_doc(cfg, slug, "spec")
        if json_output:
            _emit(payload, True)
        else:
            cli_echo(f"Spec: {payload['path']} ({len(payload['content'])} chars)")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@doc_app.command("plan")
def doc_plan(
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        payload = doc_service.read_doc(cfg, slug, "plan")
        if json_output:
            _emit(payload, True)
        else:
            cli_echo(f"Plan: {payload['path']} ({len(payload['content'])} chars)")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@doc_app.command("verify")
def doc_verify(
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    """Check whether Hub Spec/Plan pages can load (registered path + file on disk)."""
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        proj = read_project(cfg, slug)
        docs = doc_service.doc_status(cfg, slug)
        checks: list[dict[str, str | bool]] = []
        for kind in ("spec", "plan"):
            info = docs[kind]
            rel = str(info["path"])
            abs_path = str(Path(proj.repo_path) / rel) if rel else ""
            hub_ok = bool(info["configured"] and info["exists"])
            checks.append(
                {
                    "kind": kind,
                    "configured": info["configured"],
                    "exists": info["exists"],
                    "hub_visible": hub_ok,
                    "relative_path": rel,
                    "absolute_path": abs_path,
                }
            )
        payload = {
            "project": slug,
            "repo_path": proj.repo_path,
            "docs": docs,
            "hub_checks": checks,
            "all_hub_visible": all(c["hub_visible"] for c in checks if c["relative_path"]),
        }
        if json_output:
            _emit(payload, True)
        else:
            for c in checks:
                status = "OK" if c["hub_visible"] else "MISSING"
                cli_echo(f"[{status}] {c['kind']}: {c['relative_path'] or '(not configured)'}")
                if c["absolute_path"]:
                    cli_echo(f"       -> {c['absolute_path']}")
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
            cli_echo(f"Linked {resolved_slug} -> {link_path}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@agent_app.command("scan")
def agent_scan(
    json_output: bool = typer.Option(False, "--json"),
    discover: bool = typer.Option(True, "--discover/--no-discover", help="Also scan ~/.cursor, ~/.claude, etc."),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        targets = agent_patch_service.scan_targets(cfg)
        if discover:
            targets = targets + agent_patch_service.discover_dynamic_targets(cfg)
        payload = {
            "patch_id": agent_patch_service.PATCH_ID,
            "patch_version": agent_patch_service.PATCH_VERSION,
            "targets": [t.__dict__ for t in targets],
        }
        if json_output:
            _emit(payload, True)
        else:
            cli_echo(f"OpenKB agent patch v{payload['patch_version']} ({payload['patch_id']})")
            for item in targets:
                flag = {"installed": "[x]", "available": "[ ]", "missing": "[-]"}.get(item.status, "[?]")
                cli_echo(f"  {flag} {item.target_id}: {item.label}")
                cli_echo(f"      {item.path}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@agent_app.command("print-patch")
def agent_print_patch(
    json_output: bool = typer.Option(False, "--json"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        block = agent_patch_service.print_patch_block(cfg)
        if json_output:
            _emit({"patch": block}, True)
        else:
            cli_echo(block)
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@agent_app.command("status")
def agent_status(
    json_output: bool = typer.Option(False, "--json"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        payload = agent_patch_service.patch_status(cfg)
        if json_output:
            _emit(payload, True)
        else:
            cli_echo(f"Patch {payload['patch_id']} v{payload['patch_version']}")
            cli_echo(f"OPENKB_ROOT: {payload['openkb_root']}")
            cli_echo("Installed:")
            for item in payload.get("installs", []):
                cli_echo(f"  - {item.get('target_id')}: {item.get('path')}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@agent_app.command("install")
def agent_install(
    target: list[str] = typer.Option(None, "--target", help="Target id from `agent scan` (repeatable)"),
    all_targets: bool = typer.Option(False, "--all", help="Install all selectable targets"),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation"),
    json_output: bool = typer.Option(False, "--json"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        scans = agent_patch_service.scan_targets(cfg)
        selectable = [s for s in scans if s.selectable]

        chosen_ids: list[str] = []
        if all_targets:
            chosen_ids = [s.target_id for s in selectable]
        elif target:
            chosen_ids = list(target)
        elif sys.stdin.isatty() and not json_output:
            cli_echo("Select targets to patch (comma-separated ids, or 'all'):")
            for item in selectable:
                mark = "patched" if item.patched else item.status
                cli_echo(f"  {item.target_id} [{mark}] — {item.label}")
            raw = typer.prompt("Targets", default="")
            if raw.strip().lower() == "all":
                chosen_ids = [s.target_id for s in selectable]
            else:
                chosen_ids = [part.strip() for part in raw.split(",") if part.strip()]
        else:
            _emit_error("Provide --target, --all, or run interactively.", json_output)

        if not chosen_ids:
            _emit_error("No targets selected.", json_output)

        if not yes and sys.stdin.isatty() and not json_output:
            typer.confirm(f"Install patch to {len(chosen_ids)} target(s)?", abort=True)

        results = agent_patch_service.install_patch(cfg, chosen_ids)
        payload = {"results": results}
        if json_output:
            _emit(payload, True)
        else:
            for item in results:
                if item.get("ok"):
                    cli_echo(f"OK {item.get('target_id')}: {item.get('path')}")
                else:
                    cli_echo(f"FAIL {item.get('target_id')}: {item.get('error')}", err=True)
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@agent_app.command("uninstall")
def agent_uninstall(
    target: list[str] = typer.Option(None, "--target", help="Target id from install-state (repeatable)"),
    all_targets: bool = typer.Option(False, "--all", help="Remove all recorded installs"),
    yes: bool = typer.Option(False, "--yes", "-y"),
    json_output: bool = typer.Option(False, "--json"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        state = agent_patch_service.read_install_state(cfg)
        installs = state.get("installs", [])

        chosen_ids: list[str] | None
        if all_targets:
            chosen_ids = None
        elif target:
            chosen_ids = list(target)
        elif sys.stdin.isatty() and not json_output:
            if not installs:
                cli_echo("No recorded patch installs.")
                raise typer.Exit(0)
            cli_echo("Recorded installs:")
            for item in installs:
                cli_echo(f"  {item.get('target_id')}: {item.get('path')}")
            raw = typer.prompt("Uninstall (comma-separated ids, or 'all')", default="all")
            if raw.strip().lower() == "all":
                chosen_ids = None
            else:
                chosen_ids = [part.strip() for part in raw.split(",") if part.strip()]
        else:
            _emit_error("Provide --target, --all, or run interactively.", json_output)

        if not yes and sys.stdin.isatty() and not json_output:
            typer.confirm("Remove OpenKB patch block(s)?", abort=True)

        results = agent_patch_service.uninstall_patch(cfg, chosen_ids)
        payload = {"results": results}
        if json_output:
            _emit(payload, True)
        else:
            for item in results:
                cli_echo(f"{item.get('action')}: {item.get('target_id')} ({item.get('path')})")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@app.command()
def serve(
    port: int = typer.Option(8787, "--port"),
    host: str = typer.Option("127.0.0.1", "--host", help="Bind address (use 0.0.0.0 in Docker/LAN)"),
    json_output: bool = typer.Option(False, "--json"),
) -> None:
    import uvicorn

    if json_output:
        _emit({"host": host, "port": port}, True)
    uvicorn.run("openkb.api.app:app", host=host, port=port, reload=False)


@roadmap_app.callback(invoke_without_command=True)
def roadmap_show(
    ctx: typer.Context,
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    if ctx.invoked_subcommand is not None:
        return
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        payload = roadmap_payload(cfg, slug)
        if json_output:
            _emit(payload, True)
        else:
            progress = payload["progress"]
            cli_echo(f"Roadmap ({slug}): {progress['done']}/{progress['total']} done ({progress['percent']}%)")
            for phase in payload["phases"]:
                cli_echo(f"  [{phase['status']}] {phase['id']}: {phase['title']}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@roadmap_app.command("complete")
def roadmap_complete(
    phase_id: str,
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        phase, activated = complete_phase(cfg, slug, phase_id)
        payload = {
            "phase": phase.model_dump(),
            "phases_activated": activated,
        }
        if json_output:
            _emit(payload, True)
        else:
            cli_echo(f"Completed phase {phase.id}: {phase.title}")
            if activated:
                cli_echo(f"Activated: {', '.join(activated)}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@roadmap_app.command("set")
def roadmap_set(
    phase_id: str,
    status: PhaseStatus,
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        phase = set_phase_status(cfg, slug, phase_id, status)
        payload = {"phase": phase.model_dump()}
        if json_output:
            _emit(payload, True)
        else:
            cli_echo(f"Phase {phase.id} -> {phase.status}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@state_app.callback(invoke_without_command=True)
def state_show(
    ctx: typer.Context,
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    if ctx.invoked_subcommand is not None:
        return
    try:
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        path = cfg.project_dir(slug) / "STATE.md"
        state = read_state(path) if path.is_file() else None
        payload = {"state": state.model_dump() if state else _state_payload(cfg, slug)}
        if json_output:
            _emit(payload, True)
        else:
            data = payload["state"]
            summary = data.get("summary") or ""
            next_items = data.get("next_items") or data.get("next") or []
            cli_echo(f"Summary: {summary or '—'}")
            cli_echo("Next:")
            for i, item in enumerate(next_items, start=1):
                cli_echo(f"  {i}. {item}")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


@state_app.command("set")
def state_set(
    summary: str | None = typer.Option(None, "--summary"),
    next_item: list[str] = typer.Option(None, "--next"),
    watch_out: list[str] = typer.Option(None, "--watch-out"),
    blocker: str | None = typer.Option(None, "--blocker"),
    json_output: bool = typer.Option(False, "--json"),
    project: str | None = typer.Option(None, "--project"),
) -> None:
    try:
        if summary is None and next_item is None and watch_out is None and blocker is None:
            _emit_error("Provide at least one of --summary, --next, --watch-out, --blocker.", json_output)
        cfg = OpenKBConfig.load()
        slug = _resolve_slug(project)
        agent_id = get_agent_id()
        path = cfg.project_dir(slug) / "STATE.md"
        state = read_state(path) if path.is_file() else StateModel()
        patch_state_fields(
            state,
            summary=summary,
            next_items=next_item,
            watch_out=watch_out,
            blocker=blocker,
            agent_id=agent_id,
        )
        write_state(path, state, project_slug=slug)
        payload = {"state": state.model_dump()}
        if json_output:
            _emit(payload, True)
        else:
            cli_echo("STATE updated.")
    except typer.Exit:
        raise
    except Exception as exc:
        _handle_cli_error(exc, json_output)


if __name__ == "__main__":
    app()
