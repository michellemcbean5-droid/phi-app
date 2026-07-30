@echo off
REM ============================================================
REM  Prince Haul Intelligence - One-Command Play Store Build
REM  Double-click this file. It builds your store-ready .aab
REM  in the cloud and gives you a download link.
REM ============================================================

echo.
echo === Prince Haul Intelligence - Play Store Build ===
echo.

REM Make sure we are in the mobile folder
cd /d "%~dp0"

REM Check Node is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed.
    echo Download it from https://nodejs.org ^(LTS version^), install, then run this again.
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo Installing app dependencies... ^(first time only, a few minutes^)
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. Check your internet connection and try again.
        pause
        exit /b 1
    )
)

REM Quick safety check: typecheck + tests before building
echo Running quick code check...
call npx tsc --noEmit
if errorlevel 1 (
    echo [ERROR] Code check failed. Do not build - fix errors first.
    pause
    exit /b 1
)
call npx vitest run
if errorlevel 1 (
    echo [ERROR] Tests failed. Do not build - fix tests first.
    pause
    exit /b 1
)
echo Code check passed.
echo.

REM Build the production AAB in the cloud
echo Starting cloud build ^(15-25 minutes^)...
echo If asked "Generate a new Android Keystore?" press Y
echo.
call npx eas-cli build --platform android --profile production --non-interactive 2>nul
if errorlevel 1 (
    echo Non-interactive build failed ^(maybe not logged in^). Retrying with login...
    call npx eas-cli whoami >nul 2>nul
    if errorlevel 1 call npx eas-cli login
    call npx eas-cli build --platform android --profile production
)

echo.
echo === DONE ===
echo Open the link printed above and download your .aab file.
echo Then follow PHI-PLAY-STORE-GUIDE.md Part 3 to upload it.
echo.
pause
