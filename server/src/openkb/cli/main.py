import typer

app = typer.Typer(help="OpenKB — centralized Agent Kanban")


@app.callback()
def main() -> None:
    """OpenKB CLI for agent task alignment."""


if __name__ == "__main__":
    app()
