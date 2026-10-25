@echo off
title GeoNote Studio - Building Windows Standalone Executable (.exe)
color 0B
echo ====================================================================
echo        GeoNote Studio - Creating Windows Standalone .exe
echo ====================================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found on your system.
    echo Please install Node.js from https://nodejs.org (LTS recommended).
    echo After installing, double-click this file again!
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking and installing build dependencies...
call npm install --save-dev electron electron-builder
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install packages.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Building production assets...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Production build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Packaging standalone 64-bit Windows .exe...
call npx electron-builder --win --x64 --dir
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Packaging failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ====================================================================
echo  BUILD SUCCESSFUL!
echo.
echo  Your standalone Windows executable is ready at:
echo    dist-electron\win-unpacked\GeoNote Studio.exe
echo.
echo  You can run it directly or move the 'win-unpacked' folder anywhere!
echo ====================================================================
pause
