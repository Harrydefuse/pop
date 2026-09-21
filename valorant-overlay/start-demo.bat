@echo off
title VALORANT Rank Overlay (demo data)
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get it from https://nodejs.org
  pause
  exit /b 1
)

echo Running on fake data so you can position the overlay in OBS.
echo A pretend ranked game finishes every few seconds.
echo.
echo   Overlay URL for OBS:  http://localhost:3040/overlay
echo.
node src/index.js --mock
pause
