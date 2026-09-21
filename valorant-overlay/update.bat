@echo off
setlocal enabledelayedexpansion
title VALORANT Rank Overlay - update
cd /d "%~dp0"

echo.
echo Updating the overlay in this folder:
echo   %CD%
echo.
echo Close the overlay window first if it is running.
echo.

set "ZIP=%TEMP%\vro-update.zip"
set "WORK=%TEMP%\vro-update"
set "URL=https://github.com/Harrydefuse/pop/archive/refs/heads/claude/eloquent-darwin-btgopu.zip"

echo Downloading...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; try { Invoke-WebRequest -Uri '%URL%' -OutFile '%ZIP%' -UseBasicParsing } catch { Write-Host ('  ' + $_.Exception.Message); exit 1 }"
if errorlevel 1 (
  echo.
  echo Download failed. Check your internet connection.
  pause
  exit /b 1
)

if exist "%WORK%" rmdir /s /q "%WORK%"
echo Extracting...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Expand-Archive -Path '%ZIP%' -DestinationPath '%WORK%' -Force } catch { Write-Host ('  ' + $_.Exception.Message); exit 1 }"
if errorlevel 1 (
  echo Could not extract the download.
  pause
  exit /b 1
)

set "SRC="
for /d %%d in ("%WORK%\pop-*") do set "SRC=%%d\valorant-overlay"
if not defined SRC goto missing
if not exist "!SRC!\package.json" goto missing

echo Copying files into place...
xcopy "!SRC!\*" "%CD%\" /E /Y /I /Q >nul
if errorlevel 1 (
  echo.
  echo Copy failed - the overlay may still be running. Close it and try again.
  pause
  exit /b 1
)

rmdir /s /q "%WORK%" 2>nul
del "%ZIP%" 2>nul

echo.
echo Updated. This folder is now:
node -e "console.log('  version ' + require('./package.json').version)" 2>nul
if errorlevel 1 echo   (install Node.js from https://nodejs.org to run it)
echo.
echo Your settings and any custom rank art were left alone.
echo Close this window and run start.bat.
echo.
pause
exit /b 0

:missing
echo Could not find the overlay inside the download.
pause
exit /b 1
