const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('sticky',{
 list:()=>ipcRenderer.invoke('sticky-list'),create:v=>ipcRenderer.invoke('sticky-create',v),update:(id,v)=>ipcRenderer.invoke('sticky-update',id,v),remove:id=>ipcRenderer.invoke('sticky-remove',id),
 displays:()=>ipcRenderer.invoke('sticky-displays'),position:(edge,id,expanded)=>ipcRenderer.invoke('sticky-position',edge,id,expanded),close:()=>ipcRenderer.invoke('sticky-close'),export:()=>ipcRenderer.invoke('sticky-export'),
 onChange:fn=>ipcRenderer.on('sticky-changed',fn)
});
