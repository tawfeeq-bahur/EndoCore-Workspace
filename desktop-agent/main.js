const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const activeWin = require('active-win');
const axios = require('axios');
const { exec } = require('child_process');

// Helper to list friendly names of all open windows on Windows (using PowerShell)
function getOpenApps() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      // Fallback for macOS/Linux
      return resolve(['VS Code', 'Chrome Browser', 'Figma Design', 'Terminal / Shell', 'Spotify Music', 'Slack Chat']);
    }

    // PowerShell command to query open process details with visible window titles
    const cmd = `powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle} | ForEach-Object { if ($_.Description) { $_.Description } else { $_.ProcessName } }"`;
    
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error('Error fetching open apps:', err);
        return resolve([]);
      }

      const apps = stdout
        .split('\r\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line !== 'Windows Explorer' && line !== 'explorer');
      
      // Normalize names to match standard options where possible
      const normalized = apps.map(app => {
        if (app.toLowerCase() === 'code' || app === 'Visual Studio Code') return 'VS Code';
        if (app.toLowerCase() === 'chrome' || app === 'Google Chrome') return 'Chrome';
        if (app.toLowerCase() === 'figma') return 'Figma';
        if (app.toLowerCase() === 'spotify') return 'Spotify';
        if (app.toLowerCase() === 'slack') return 'Slack';
        return app;
      });

      // Deduplicate and return
      resolve([...new Set(normalized)]);
    });
  });
}

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
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message}`);
  });

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

      // Get list of currently open applications on Windows
      const openApps = await getOpenApps();

      // Send active app and open apps to backend
      await axios.post(
        `${config.backendUrl}/api/my-activity`,
        {
          app: appName,
          project: windowTitle,
          openApps: openApps
        },
        {
          headers: { Authorization: `Bearer ${config.token}` }
        }
      );
      
      console.log(`Tracked active: ${appName} - ${windowTitle} | Open apps count: ${openApps.length}`);
    } catch (err) {
      console.error('Error tracking active window:', err.message);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        isTracking = false;
        clearInterval(trackerInterval);
        console.log('Stopped tracking active window due to authentication failure.');
        config.token = '';
        if (mainWindow) {
          mainWindow.webContents.send('tracking-state', { isTracking });
          mainWindow.webContents.send('auth-error', 'Session expired. Please reconnect.');
        }
      }
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
