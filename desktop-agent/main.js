const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const activeWin = require('active-win');
const axios = require('axios');

let mainWindow;
let tray;
let trackerInterval;
let isTracking = false;
let config = {
  backendUrl: 'http://localhost:3000',
  token: '',
  email: ''
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#09090b',
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupTray() {
  // Gracefully fallback if icon is missing
  const iconPath = path.join(__dirname, 'icon.png');
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Agent Panel', click: () => { if (mainWindow) mainWindow.show(); else createWindow(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quit(); } }
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip('EndoCore Agent');
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) mainWindow.hide();
      else mainWindow.show();
    } else {
      createWindow();
    }
  });
}

ipcMain.on('save-config', (event, newConfig) => {
  config = { ...config, ...newConfig };
  event.reply('config-saved', config);
  console.log('Saved configuration:', config.email);
});

ipcMain.on('start-tracking', (event) => {
  if (isTracking) return;
  isTracking = true;
  console.log('Started tracking active window...');
  
  trackerInterval = setInterval(async () => {
    if (!isTracking || !config.token) return;
    try {
      const window = await activeWin();
      if (!window) return;

      const appName = window.owner.name || 'Unknown';
      const windowTitle = window.title || 'Unknown';

      // Send active app to backend
      await axios.post(
        `${config.backendUrl}/api/my-activity`,
        {
          app: appName,
          project: windowTitle
        },
        {
          headers: { Authorization: `Bearer ${config.token}` }
        }
      );
      
      console.log(`Tracked active application: ${appName} - ${windowTitle}`);
    } catch (err) {
      console.error('Error tracking active window:', err.message);
    }
  }, 5000);

  event.reply('tracking-state', { isTracking });
});

ipcMain.on('stop-tracking', (event) => {
  if (!isTracking) return;
  isTracking = false;
  clearInterval(trackerInterval);
  console.log('Stopped tracking active window.');
  event.reply('tracking-state', { isTracking });
});

app.on('ready', () => {
  createWindow();
  try {
    setupTray();
  } catch (e) {
    console.log('System tray icon initialization skipped (no icon file).');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep agent running in tray even when window is closed
  }
});
