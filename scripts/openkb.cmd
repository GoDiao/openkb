@echo off
setlocal
if "%OPENKB_ROOT%"=="" (
  echo ERROR: OPENKB_ROOT is not set. See README.md Installation or .env.example
  exit /b 1
)
if not exist "%OPENKB_ROOT%\pyproject.toml" (
  echo ERROR: OPENKB_ROOT is not a valid OpenKB root: %OPENKB_ROOT%
  exit /b 1
)
pushd "%OPENKB_ROOT%"
uv run openkb %*
set EXITCODE=%ERRORLEVEL%
popd
exit /b %EXITCODE%
