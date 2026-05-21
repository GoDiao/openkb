# OpenKB CLI wrapper — requires OPENKB_ROOT and uv on PATH.
# Usage: .\scripts\openkb.ps1 context --json
# Or add OpenKB/scripts to PATH and run: openkb.ps1 context --json

$ErrorActionPreference = "Stop"

$root = $env:OPENKB_ROOT
if (-not $root) {
    Write-Error "OPENKB_ROOT is not set. See README.md Installation or .env.example"
}

if (-not (Test-Path (Join-Path $root "pyproject.toml"))) {
    Write-Error "OPENKB_ROOT does not look like OpenKB root: $root"
}

Push-Location $root
try {
    if ($env:UV_CACHE_DIR) {
        uv run openkb @args
    } else {
        uv run openkb @args
    }
} finally {
    Pop-Location
}
