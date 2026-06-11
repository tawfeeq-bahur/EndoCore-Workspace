const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  onConfigSaved: (callback) => ipcRenderer.on('config-saved', (event, config) => callback(config)),
  startTracking: () => ipcRenderer.send('start-tracking'),
  stopTracking: () => ipcRenderer.send('stop-tracking'),
  onTrackingState: (callback) => ipcRenderer.on('tracking-state', (event, state) => callback(state))
});
