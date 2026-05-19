from __future__ import annotations

from typing import get_args

from openkb.models import BoardColumn, priority_rank


def test_task_model_columns() -> None:
    assert set(get_args(BoardColumn)) == {"backlog", "todo", "doing", "review", "done"}


def test_task_model_priority_order() -> None:
    assert priority_rank("P0") < priority_rank("P1")
