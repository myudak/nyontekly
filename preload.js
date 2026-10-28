const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('nyontekly', {
  onExamResult: fn => ipcRenderer.on('exam-result',(_e,result)=>fn(result)),
  copyText: value => ipcRenderer.invoke('copy-text',value),
  shortcuts: value => ipcRenderer.invoke('shortcuts',value), ocr: bytes => ipcRenderer.invoke('ocr',bytes),
  examOpen: input => ipcRenderer.invoke('exam-open',input), examStop: () => ipcRenderer.invoke('exam-stop'), examMock: () => ipcRenderer.invoke('exam-mock'),
  sources: () => ipcRenderer.invoke('sources'), selectSource: id => ipcRenderer.invoke('select-source',id),
  action: (name,value) => ipcRenderer.invoke('window-action',name,value),
  copyImage: bytes => ipcRenderer.invoke('copy-image',bytes), saveFile: (bytes,kind) => ipcRenderer.invoke('save-file',bytes,kind),
  onScreenshotShortcut: fn => ipcRenderer.on('shortcut-screenshot',fn)
});
