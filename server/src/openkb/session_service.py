from __future__ import annotations

from datetime import datetime
from pathlib import Path


def append_session(
    project_dir: Path,
    agent_id: str,
    task_id: str,
    action: str,
    summary: str,
) -> Path:
    sessions_dir = project_dir / "sessions"
    sessions_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y-%m-%dT%H%M")
    path = sessions_dir / f"{ts}-{agent_id}.md"
    path.write_text(
        f"# Session {ts}\n\n"
        f"- Agent: {agent_id}\n"
        f"- Task: {task_id}\n"
        f"- Action: {action}\n\n"
        f"{summary}\n",
        encoding="utf-8",
    )
    return path
