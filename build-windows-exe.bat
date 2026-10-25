@echo off
echo ====================================================================
echo        GeoNote Studio - Windows Desktop Application (.exe) Build
echo ====================================================================
echo.
echo Step 1: Checking and installing electron and electron-builder...
call npm install --save-dev electron electron-builder
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install Electron dependencies. Please check your internet connection.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Step 2: Compiling GeoNote Studio web bundle...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed. Please fix errors before packaging.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Step 3: Generating Windows 64-bit Executable (.exe)...
call npx electron-builder --win --x64
if %ERRORLEVEL% NEQ 0 (
    echo Electron-builder packaging failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ====================================================================
echo  SUCCESS! Your Windows standalone application .exe is ready:
echo.
echo  1. Portable .exe (Run directly):
echo     dist-electron\GeoNote Studio.exe
echo.
echo  2. Unpacked .exe (Folder version):
echo     dist-electron\win-unpacked\GeoNote Studio.exe
echo.
echo  3. Windows Setup Installer:
echo     dist-electron\GeoNote Studio Setup 0.0.0.exe
echo ====================================================================
pause
