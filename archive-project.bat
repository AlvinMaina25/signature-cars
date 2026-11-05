@echo off
setlocal EnableExtensions

REM ============================================================
REM  Archive the Signature Cars Limited project to a .zip (excludes junk + secrets)
REM  Place this file in the project root and double-click it.
REM  The zip is saved in the PARENT folder of the project.
REM ============================================================

REM --- Options (1 = yes, 0 = no) ---
set "INCLUDE_GIT=1"
set "INCLUDE_ENV=0"

REM --- Resolve paths ---
set "PROJECT=%~dp0"
if "%PROJECT:~-1%"=="\" set "PROJECT=%PROJECT:~0,-1%"
for %%I in ("%PROJECT%") do set "NAME=%%~nxI"
for %%I in ("%PROJECT%\..") do set "OUTDIR=%%~fI"

for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm"') do set "STAMP=%%T"

set "ZIP=%OUTDIR%\%NAME%_%STAMP%.zip"
set "STAGE=%TEMP%\%NAME%_stage_%STAMP%"

REM --- Folders to exclude (matched at any depth) ---
set "XD=node_modules dist dist-ssr .output .vinxi .tanstack .nitro .wrangler .idea .vscode\.history coverage .cache .turbo .next"
if "%INCLUDE_GIT%"=="0" set "XD=%XD% .git"

REM --- Files to exclude ---
set "XF=*.log npm-debug.log* yarn-debug.log* yarn-error.log* pnpm-debug.log* lerna-debug.log* .DS_Store Thumbs.db *.suo *.ntvs* *.njsproj *.sln *.sw? .dev.vars *.local"
if "%INCLUDE_ENV%"=="0" set "XF=%XF% .env .env.*"

echo.
echo Project : %PROJECT%
echo Output  : %ZIP%
echo.
echo Copying files to temporary folder...

robocopy "%PROJECT%" "%STAGE%" /E /XD %XD% /XF %XF% /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
    echo.
    echo ERROR: Copy step failed.
    goto :cleanup
)

echo Creating zip...
tar -a -c -f "%ZIP%" -C "%STAGE%" .
if errorlevel 1 (
    echo.
    echo ERROR: Zip creation failed.
    goto :cleanup
)

echo.
echo Done! Archive created:
echo   %ZIP%

:cleanup
if exist "%STAGE%" rmdir /s /q "%STAGE%"
echo.
pause
endlocal
