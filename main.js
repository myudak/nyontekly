const { app, BrowserWindow, desktopCapturer, ipcMain, session, globalShortcut, dialog, clipboard, nativeImage, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const http = require('node:http');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const {configProfile, parseUrl, rewriteHeaders, sha256} = require('./seb');
let win, requestedSource = null, examWindow, examProfile = null, mockServer = null;
const examSessionName = 'persist:nyontekly-exam';
const local = e => e.sender === win?.webContents;
function createWindow() {
  win = new BrowserWindow({ width: 470, height: 730, minWidth: 380, minHeight: 480, frame: false, alwaysOnTop: true, backgroundColor: '#101116', title: 'Nyontekly', webPreferences: { preload: path.join(__dirname,'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, webviewTag: true } });
  win.setContentProtection(true);
  win.loadFile('index.html');
  if(process.env.NYONTEKLY_SCREENSHOT==='1'){win.webContents.once('did-finish-load',()=>setTimeout(async()=>{try{const out=path.join(__dirname,'docs');await fs.mkdir(out,{recursive:true});const image=await win.webContents.capturePage();await fs.writeFile(path.join(out,'workspace.png'),image.toPNG());console.log('Saved docs/workspace.png');app.quit();}catch(e){console.error(e);app.exit(1);}},1500));}
  win.webContents.on('will-attach-webview', (event, prefs, params) => {
    const providers = {'https://chatgpt.com/':'persist:chatgpt','https://claude.ai/':'persist:claude','https://gemini.google.com/':'persist:gemini'};
    if (providers[params.src] !== params.partition) return event.preventDefault();
    delete prefs.preload; prefs.nodeIntegration = false; prefs.contextIsolation = true; prefs.sandbox = true;
  });
  win.webContents.on('did-attach-webview', (_event, guest) => {
    guest.setWindowOpenHandler(({url}) => { if (url.startsWith('https://')) shell.openExternal(url); return {action:'deny'}; });
    guest.on('will-navigate', (event, url) => { if (!url.startsWith('https://')) event.preventDefault(); });
  });
  win.webContents.setWindowOpenHandler(() => ({action:'deny'}));
  win.webContents.on('will-navigate', e => e.preventDefault());
}
app.whenReady().then(() => {
  const s = session.defaultSession;
  s.setPermissionRequestHandler((wc, permission, callback) => callback(wc === win?.webContents && permission === 'display-capture'));
  s.setDisplayMediaRequestHandler(async (request, callback) => {
    if (request.frame !== win?.webContents.mainFrame || !requestedSource) return callback({});
    const id = requestedSource; requestedSource = null;
    try { const sources = await desktopCapturer.getSources({types:['screen','window'], thumbnailSize:{width:0,height:0}}); const source = sources.find(x => x.id === id); callback(source ? {video: source} : {}); } catch { callback({}); }
  });
  const examSession=session.fromPartition(examSessionName);
  examSession.webRequest.onBeforeSendHeaders((details, callback) => callback({requestHeaders:rewriteHeaders(details,examProfile)}));
  examSession.webRequest.onCompleted((details)=>{ if(win && details.resourceType==='mainFrame') win.webContents.send('exam-result',{url:details.url,status:details.statusCode}); });
  examSession.webRequest.onErrorOccurred((details)=>{ if(win && details.resourceType==='mainFrame') win.webContents.send('exam-result',{url:details.url,error:details.error}); });
  examSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  createWindow();
  registerShortcuts({toggle:'CommandOrControl+Shift+Space',capture:'CommandOrControl+Shift+S'});
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());
ipcMain.handle('sources', async e => { if (!local(e)) return []; const sources=await desktopCapturer.getSources({types:['screen','window'], thumbnailSize:{width:240,height:135}}); return sources.filter(s => !s.name.includes('Nyontekly')).map(s=>({id:s.id,name:s.name,thumbnail:s.thumbnail.toDataURL()})); });
ipcMain.handle('select-source', (e,id) => { if (!local(e) || typeof id !== 'string') return false; requestedSource=id; return true; });
ipcMain.handle('window-action', (e,action,value) => { if (!local(e)) return; if(action==='hide') win.hide(); if(action==='minimize') win.minimize(); if(action==='close') win.close(); if(action==='pin') win.setAlwaysOnTop(Boolean(value)); if(action==='protection') win.setContentProtection(Boolean(value)); if(action==='opacity') win.setOpacity(Math.max(0.4,Math.min(1,Number(value)||1))); });
ipcMain.handle('copy-image', (e,bytes) => { if (!local(e) || bytes.byteLength > 30_000_000) return false; clipboard.writeImage(nativeImage.createFromBuffer(Buffer.from(bytes))); return true; });
ipcMain.handle('save-file', async (e, bytes, kind) => { if (!local(e) || !['png','webm'].includes(kind) || bytes.byteLength > 500_000_000) throw new Error('File is too large or invalid'); const {canceled,filePath}=await dialog.showSaveDialog(win,{defaultPath:`nyontekly-${Date.now()}.${kind}`,filters:[{name:kind.toUpperCase(),extensions:[kind]}]}); if(canceled || !filePath) return false; await fs.writeFile(filePath,Buffer.from(bytes)); return true; });

function openExam(url) {
  const safeUrl=parseUrl(url);
  if (examWindow && !examWindow.isDestroyed()) examWindow.close();
  examWindow=new BrowserWindow({width:1100,height:760,title:'Nyontekly — Exam browser',webPreferences:{partition:examSessionName,nodeIntegration:false,contextIsolation:true,sandbox:true}});
  examWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  examWindow.webContents.on('will-navigate',(e,target)=>{try{parseUrl(target)}catch{e.preventDefault()}});
  examWindow.loadURL(safeUrl);
}
ipcMain.handle('exam-open', (e, input) => {
  if (!local(e)) throw new Error('Not allowed');
  if (!input || typeof input !== 'object') throw new Error('Invalid settings');
  const target=parseUrl(input.url);
  if (input.mode==='config') {
    examProfile=configProfile(input.config);
    if(target!==examProfile.startUrl) throw new Error('Exam URL must match the config startURL.');
  } else if (input.mode==='manual') {
    if(!/^[a-f0-9]{64}$/i.test(input.hash)) throw new Error('Enter a 64-character hexadecimal Config Key Hash.');
    examProfile={startUrl:target,configKeyHash:input.hash.toLowerCase()};
  } else if (input.mode==='off') examProfile=null;
  else throw new Error('Unknown mode');
  openExam(target); return {url:target, enabled:!!examProfile};
});
ipcMain.handle('exam-stop', e => { if (!local(e)) return; examProfile=null; if(examWindow&&!examWindow.isDestroyed())examWindow.close(); });
ipcMain.handle('exam-mock', async e => {
  if (!local(e)) throw new Error('Not allowed');
  if (mockServer) await new Promise(resolve=>mockServer.close(resolve));
  const secret=crypto.randomBytes(32).toString('hex');
  mockServer=http.createServer((req,res)=>{
    const actual=String(req.headers['x-safeexambrowser-configkeyhash']||'');
    const url=`http://127.0.0.1:${mockServer.address().port}${req.url}`;
    const ok=actual===sha256(url+secret);
    res.writeHead(ok?200:403,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'"});
    res.end(`<!doctype html><title>Mock exam</title><body style="font:16px system-ui;background:#101116;color:#eee;padding:4rem"><h1>Mock exam: ${ok?'header accepted':'header missing or incorrect'}</h1><p>This is a local test, not a real examination service.</p></body>`);
  });
  await new Promise((resolve,reject)=>{mockServer.once('error',reject);mockServer.listen(0,'127.0.0.1',resolve)});
  const url=`http://127.0.0.1:${mockServer.address().port}/exam`;
  examProfile={startUrl:url,configKeyHash:sha256(url+secret)}; openExam(url);
  return {url};
});
app.on('before-quit',()=>{if(mockServer)mockServer.close();});

let activeShortcuts = {};
function registerShortcuts(next) {
  if(!next || typeof next.toggle!=='string' || typeof next.capture!=='string' || next.toggle===next.capture) throw new Error('Enter two different shortcuts.');
  const old={...activeShortcuts}; globalShortcut.unregisterAll();
  const bind=(x)=>{ try { return globalShortcut.register(x.toggle,()=>{if(!win)return;if(win.isVisible())win.hide();else {win.show();win.focus();}}) && globalShortcut.register(x.capture,()=>{if(win){win.show();win.webContents.send('shortcut-screenshot');}}); } catch { return false; } };
  if(!bind(next)){globalShortcut.unregisterAll();if(old.toggle)bind(old);throw new Error('A shortcut is invalid or already in use.');} activeShortcuts={...next};return activeShortcuts;
}
ipcMain.handle('shortcuts', (e, value)=>{if(!local(e))throw new Error('Not allowed');return registerShortcuts(value);});
ipcMain.handle('ocr', async(e,bytes)=>{
  if(!local(e)||bytes.byteLength>15000000)throw new Error('Invalid or oversized image.');
  return await new Promise((resolve,reject)=>{const child=spawn('tesseract',['stdin','stdout','-l','eng']);let output='',error='';const timer=setTimeout(()=>{child.kill();reject(new Error('OCR timed out.'));},60000);child.on('error',()=>{clearTimeout(timer);reject(new Error('Tesseract was not found. Install Tesseract and add it to PATH.'));});child.stdout.on('data',d=>{output+=d.toString()});child.stderr.on('data',d=>{error+=d.toString()});child.on('close',code=>{clearTimeout(timer);if(code!==0)reject(new Error(error.slice(0,500)||'OCR failed.'));else resolve(output);});child.stdin.on('error',()=>{});child.stdin.end(Buffer.from(bytes));});
});

ipcMain.handle('copy-text', (e,text)=>{if(!local(e)||typeof text!=='string'||text.length>1000000)throw new Error('Invalid text');clipboard.writeText(text);});
