@echo off
title VALORANT Rank Overlay
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed.
  echo.
  echo Install it from https://nodejs.org ^(pick the LTS button^), then
  echo run this file again.
  echo.
  pause
  exit /b 1
)

echo Running from:
echo   %CD%
echo.
echo   Overlay URL for OBS:  http://localhost:3040/overlay
echo   If something is wrong: http://localhost:3040/debug
echo.
node src/index.js

echo.
echo The overlay stopped. Any reason is shown above.
pause
