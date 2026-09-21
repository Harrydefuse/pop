@echo off
title VALORANT Rank Overlay - connection check
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get it from https://nodejs.org
  pause
  exit /b 1
)

node src/index.js --check
pause
