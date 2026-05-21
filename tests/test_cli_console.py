from __future__ import annotations

import io
import sys

from openkb.cli.console import cli_echo, ensure_stdio_utf8


def test_ensure_stdio_utf8_does_not_raise() -> None:
    ensure_stdio_utf8()


def test_cli_echo_survives_gbk_stdout() -> None:
    buffer = io.BytesIO()
    stream = io.TextIOWrapper(buffer, encoding="gbk", errors="strict")
    old_stdout = sys.stdout
    sys.stdout = stream
    try:
        cli_echo("Done 005: Phase 7 中文 «Next advanced»")
        stream.flush()
    finally:
        sys.stdout = old_stdout
    assert buffer.getvalue()


def test_cli_echo_survives_gbk_stderr() -> None:
    buffer = io.BytesIO()
    stream = io.TextIOWrapper(buffer, encoding="gbk", errors="strict")
    old_stderr = sys.stderr
    sys.stderr = stream
    try:
        cli_echo("错误：中文 «guillemets»", err=True)
        stream.flush()
    finally:
        sys.stderr = old_stderr
    assert buffer.getvalue()
