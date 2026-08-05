const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayAPI', {
  onNowPlaying: (callback) => ipcRenderer.on('now-playing', (_event, data) => callback(data)),
  onShowCard: (callback) => ipcRenderer.on('show-card', () => callback()),
  onHideCard: (callback) => ipcRenderer.on('hide-card', () => callback()),
});

contextBridge.exposeInMainWorld('settingsAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  completeFirstRun: () => ipcRenderer.invoke('complete-first-run'),
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (_event, data) => callback(data)),
});