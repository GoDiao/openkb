# Contributing to OpenKB

Thanks for improving OpenKB. This project is maintained as a **single-user / trusted-network** Agent hub; keep changes focused and tested.

## Development setup

```bash
uv sync --dev
cd web && npm ci && npm run build
export OPENKB_ROOT="$(pwd)/.."
uv run pytest
cd web && npm run test:e2e
```

See [README.md](README.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Product narrative: [docs/WHY_OPENKB.md](docs/WHY_OPENKB.md).

## Pull requests

1. Branch from `master` / `main`.
2. Run **pytest** and **`npm run build`**; E2E if you touch Hub or API sync.
3. Match existing code style; avoid unrelated refactors.
4. Update **CHANGELOG.md** under `[Unreleased]` for user-visible changes.

## Security

Do not open public issues for exploitable bugs. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
