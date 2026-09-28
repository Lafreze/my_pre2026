@echo off
chcp 65001 >nul
title Generative AI Presentation
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-local.ps1"
if errorlevel 1 (
  echo.
  echo The presentation could not be started. See the message above.
  pause
)
