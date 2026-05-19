from __future__ import annotations

from pathlib import Path

from openkb.markdown_io import read_task_file, write_task_file

FIXTURE = Path(__file__).parent / "fixtures" / "sample_task.md"


def test_read_task_file() -> None:
    task = read_task_file(FIXTURE, column="todo")
    assert task.id == "001"
    assert task.title == "Sample task"
    assert task.acceptance == ["- [ ] Step one", "- [x] Step two"]
    assert "Initial note." in task.notes


def test_roundtrip_task_file(tmp_path: Path) -> None:
    src = read_task_file(FIXTURE, column="todo")
    out = tmp_path / "001-sample-task.md"
    write_task_file(out, src, column="doing")
    back = read_task_file(out, column="doing")
    assert back.status == "doing"
    assert back.title == src.title
