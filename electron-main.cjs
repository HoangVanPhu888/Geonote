/**
 * Electron Main Process for GeoNote Studio Desktop Application
 * Packages GeoNote Studio as a native Windows .exe application
 */
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'GeoNote Studio - Scrble & Dynamic Geometry',
    frame: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Ensures local file:// font and asset loading succeeds
    },
    icon: path.join(__dirname, 'public/favicon.ico'),
  });

  // Locate the bundled index.html
  const possiblePaths = [
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html'),
  ];

  let indexPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      indexPath = p;
      break;
    }
  }

  if (indexPath) {
    mainWindow.loadFile(indexPath);
  } else if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Remove default menu bar if preferred to use native in-app Windows titlebar
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
