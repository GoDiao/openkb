# One-time User environment setup (Windows only, optional).
# Cross-platform install: see README.md — use `uv run openkb` and export env vars manually.
#
#   .\scripts\setup-openkb-env.ps1
# Re-open terminal after running.

param(
    [string]$OpenKBRoot = "E:/AProject/TianX/Personal/OpenKB",
    [string]$UvCache = "E:/uv-cache",
    [string]$AgentId = $env:USERNAME
)

$OpenKBRoot = (Resolve-Path $OpenKBRoot).Path
$scripts = Join-Path $OpenKBRoot "scripts"

[Environment]::SetEnvironmentVariable("OPENKB_ROOT", $OpenKBRoot, "User")
[Environment]::SetEnvironmentVariable("UV_CACHE_DIR", $UvCache, "User")
[Environment]::SetEnvironmentVariable("OPENKB_AGENT_ID", $AgentId, "User")

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$scripts*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$scripts", "User")
    Write-Host "Added to User PATH: $scripts"
}

Write-Host "Set OPENKB_ROOT=$OpenKBRoot"
Write-Host "Set UV_CACHE_DIR=$UvCache"
Write-Host "Set OPENKB_AGENT_ID=$AgentId"
Write-Host "Re-open terminal. CLI: uv run openkb --help  (or openkb.cmd on Windows PATH)"
