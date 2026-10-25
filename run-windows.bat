@echo off
title Launching GeoNote Studio Desktop...
color 0A
echo ====================================================================
echo               GeoNote Studio - Windows Desktop Application
echo ====================================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found on your system.
    echo Please install Node.js from https://nodejs.org (LTS recommended).
    echo After installing Node.js, run this file again!
    echo.
    pause
    exit /b 1
)

:: Install dependencies if not installed yet
if not exist "node_modules" (
    echo [1/3] First-time setup: Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b %ERRORLEVEL%
    )
)

echo [2/3] Compiling interface assets...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Launching GeoNote Studio in native Windows Desktop window...
echo.
call npx electron .
