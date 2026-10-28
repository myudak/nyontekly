const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('nyontekly', {
  openSticky: () => ipcRenderer.invoke('sticky-open'),
  pedalFolder: () => ipcRenderer.invoke('pedal-folder'), pedalStart: options => ipcRenderer.invoke('pedal-start',options), pedalStop: () => ipcRenderer.invoke('pedal-stop'), onPedalStatus: fn => ipcRenderer.on('pedal-status',(_e,status)=>fn(status)),
  cleanerFolder: () => ipcRenderer.invoke('cleaner-folder'), cleanerRun: (bytes,options) => ipcRenderer.invoke('cleaner-run',bytes,options), cleanerCancel: () => ipcRenderer.invoke('cleaner-cancel'), onCleanerProgress: fn => ipcRenderer.on('cleaner-progress',(_e,text)=>fn(text)),
  transcribe: (bytes,options) => ipcRenderer.invoke('voice-transcribe',bytes,options), stopVoice: () => ipcRenderer.invoke('voice-stop'), onVoiceStatus: fn => ipcRenderer.on('voice-status',(_e,status)=>fn(status)),
  onExamResult: fn => ipcRenderer.on('exam-result',(_e,result)=>fn(result)),
  copyText: value => ipcRenderer.invoke('copy-text',value),
  shortcuts: value => ipcRenderer.invoke('shortcuts',value), ocr: bytes => ipcRenderer.invoke('ocr',bytes),
  examOpen: input => ipcRenderer.invoke('exam-open',input), examStop: () => ipcRenderer.invoke('exam-stop'), examMock: () => ipcRenderer.invoke('exam-mock'),
  sources: () => ipcRenderer.invoke('sources'), selectSource: (id,audio) => ipcRenderer.invoke('select-source',id,audio),
  action: (name,value) => ipcRenderer.invoke('window-action',name,value),
  copyImage: bytes => ipcRenderer.invoke('copy-image',bytes), saveFile: (bytes,kind) => ipcRenderer.invoke('save-file',bytes,kind),
  onScreenshotShortcut: fn => ipcRenderer.on('shortcut-screenshot',fn)
});
