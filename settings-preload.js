const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('webToolSettings', {
  get: () => ipcRenderer.invoke('settings:get'),
  update: change => ipcRenderer.invoke('settings:update', change)
})
