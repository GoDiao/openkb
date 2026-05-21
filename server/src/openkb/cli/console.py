from __future__ import annotations

import sys

import click


def ensure_stdio_utf8() -> None:
    """Prefer UTF-8 on Windows consoles; fall back safely on older streams."""
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is None:
            continue
        try:
            reconfigure(encoding="utf-8", errors="replace")
        except (OSError, ValueError, TypeError):
            continue


def cli_echo(message: str | None = None, *, err: bool = False, nl: bool = True) -> None:
    """Echo CLI text without crashing on legacy Windows code pages (e.g. GBK)."""
    if message is None:
        return
    stream = sys.stderr if err else sys.stdout
    try:
        click.echo(message, file=stream, nl=nl)
    except UnicodeEncodeError:
        encoding = getattr(stream, "encoding", None) or "utf-8"
        safe = message.encode(encoding, errors="replace").decode(encoding, errors="replace")
        click.echo(safe, file=stream, nl=nl)
