const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  onConfigSaved: (callback) => ipcRenderer.on('config-saved', (event, config) => callback(config)),
  startTracking: () => ipcRenderer.send('start-tracking'),
  stopTracking: () => ipcRenderer.send('stop-tracking'),
  onTrackingState: (callback) => ipcRenderer.on('tracking-state', (event, state) => callback(state)),
  onAuthError: (callback) => ipcRenderer.on('auth-error', (event, message) => callback(message)),
  showNotification: (data) => ipcRenderer.invoke('notification:show', data)
});

contextBridge.exposeInMainWorld('endocoreDesktop', {
  showNotification: (payload) => ipcRenderer.invoke('notification:show', payload),
  onNavigateToConnection: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('navigate-to-connection', listener);
    return () => ipcRenderer.removeListener('navigate-to-connection', listener);
  }
});
