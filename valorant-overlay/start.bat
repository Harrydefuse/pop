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

echo Starting the rank overlay. Leave this window open while you stream.
echo.
echo   Overlay URL for OBS:  http://localhost:3040/overlay
echo   Settings and status:  http://localhost:3040/control
echo.
node src/index.js

echo.
echo The overlay stopped. Any reason is shown above.
pause
