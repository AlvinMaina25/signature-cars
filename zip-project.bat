@echo off
setlocal

rem ============================================================
rem  Zip this project (safe to share) - just double-click.
rem  The zip is saved in the PARENT folder of the project.
rem  Excludes: node_modules, .env files, keys, build output, etc.
rem ============================================================

cd /d "%~dp0"

rem Project folder name
for %%I in ("%~dp0.") do set "PROJ=%%~nxI"

rem Timestamp like 2026-11-03_14-30
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm"') do set "TS=%%i"

set "OUT=%~dp0..\%PROJ%_%TS%.zip"

echo.
echo Zipping project: %PROJ%
echo Output: %OUT%
echo.

rem Uses tar (built into Windows 10/11). -a picks zip format from the .zip extension.
tar -a -cf "%OUT%" ^
  --exclude="node_modules" ^
  --exclude=".git" ^
  --exclude=".env" ^
  --exclude=".env.*" ^
  --exclude=".dev.vars" ^
  --exclude=".wrangler" ^
  --exclude=".output" ^
  --exclude=".vercel" ^
  --exclude=".netlify" ^
  --exclude=".tanstack" ^
  --exclude=".vinxi" ^
  --exclude="dist" ^
  --exclude="build" ^
  --exclude="coverage" ^
  --exclude="supabase\.temp" ^
  --exclude="supabase\.branches" ^
  --exclude="*.pem" ^
  --exclude="*.key" ^
  --exclude="*.p12" ^
  --exclude="*.pfx" ^
  --exclude="*.log" ^
  --exclude=".DS_Store" ^
  --exclude="Thumbs.db" ^
  -C "%~dp0." .

if errorlevel 1 (
  echo.
  echo [ERROR] Something went wrong while creating the zip.
  pause
  exit /b 1
)

echo.
echo [DONE] Created: %PROJ%_%TS%.zip
echo Saved in: %~dp0..
echo.
pause
endlocal
