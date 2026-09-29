const { app, BrowserWindow, Menu, Tray, ipcMain, session } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

// Keep the same Chromium profile for `npm start` and the packaged .exe.
const profilePath = path.join(app.getPath('appData'), 'electron-web-tool')
fs.mkdirSync(profilePath, { recursive: true })
app.setPath('userData', profilePath)
app.setPath('sessionData', profilePath)

const defaults = {
  toolUrl: 'https://chatgpt.com/',
  opacity: 0.85,
  alwaysOnTop: true
}

let mainWin
let settingsWin
let settings
let tray
let cookieFlushTimer

function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

function validUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function loadSettings() {
  let saved = {}
  try {
    saved = JSON.parse(fs.readFileSync(settingsPath(), 'utf8'))
  } catch { /* First launch or invalid settings file. */ }

  return {
    toolUrl: validUrl(process.env.TOOL_URL) ? process.env.TOOL_URL
      : validUrl(saved.toolUrl) ? saved.toolUrl : defaults.toolUrl,
    opacity: typeof saved.opacity === 'number' && Number.isFinite(saved.opacity)
      ? Math.max(0.35, Math.min(1, saved.opacity)) : defaults.opacity,
    alwaysOnTop: typeof saved.alwaysOnTop === 'boolean'
      ? saved.alwaysOnTop : defaults.alwaysOnTop
  }
}

function saveSettings() {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2))
}

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1000,
    height: 750,
    minWidth: 500,
    minHeight: 400,
    title: 'Web Tool',
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: true,
    webPreferences: {
      session: session.defaultSession,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  mainWin.setContentProtection(true)
  mainWin.setOpacity(settings.opacity)
  mainWin.webContents.on('did-create-window', child => {
    child.setSkipTaskbar(true)
    child.setContentProtection(true)
    child.setOpacity(settings.opacity)
  })
  mainWin.loadURL(settings.toolUrl)
  mainWin.on('closed', () => { mainWin = null })
}

function openSettings() {
  showMainWindow()
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.focus()
    return
  }

  settingsWin = new BrowserWindow({
    width: 420,
    height: 365,
    resizable: false,
    title: 'Web Tool Settings',
    parent: mainWin,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'settings-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })
  settingsWin.setContentProtection(true)
  settingsWin.loadFile('settings.html')
  settingsWin.on('closed', () => { settingsWin = null })
}

function showMainWindow() {
  if (mainWin.isMinimized()) mainWin.restore()
  mainWin.show()
  mainWin.focus()
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'tray.png'))
  tray.setToolTip('Web Tool')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show Web Tool', click: showMainWindow },
    { label: 'Settings...', click: openSettings },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]))
  tray.on('click', showMainWindow)
}

app.whenReady().then(() => {
  settings = loadSettings()
  const browserSession = session.defaultSession
  if (!browserSession.isPersistent()) throw new Error('Browser session must be persistent')

  // Keep Chromium's own cookie and site storage on disk; never copy tokens into app settings.
  browserSession.cookies.on('changed', () => {
    clearTimeout(cookieFlushTimer)
    cookieFlushTimer = setTimeout(() => {
      browserSession.cookies.flushStore().catch(console.error)
      browserSession.flushStorageData()
    }, 2000)
  })

  ipcMain.handle('settings:get', event => {
    if (event.sender !== settingsWin?.webContents) throw new Error('Invalid sender')
    return settings
  })

  ipcMain.handle('settings:update', (event, update) => {
    if (event.sender !== settingsWin?.webContents) throw new Error('Invalid sender')

    if (Object.hasOwn(update, 'opacity')) {
      const value = Number(update.opacity)
      if (!Number.isFinite(value)) throw new Error('Invalid opacity')
      settings.opacity = Math.max(0.35, Math.min(1, value))
      mainWin.setOpacity(settings.opacity)
    }
    if (Object.hasOwn(update, 'alwaysOnTop')) {
      settings.alwaysOnTop = Boolean(update.alwaysOnTop)
      mainWin.setAlwaysOnTop(settings.alwaysOnTop)
    }
    if (Object.hasOwn(update, 'toolUrl')) {
      const url = String(update.toolUrl).trim()
      if (!validUrl(url)) throw new Error('Enter a valid HTTPS URL')
      settings.toolUrl = url
      mainWin.loadURL(url)
    }

    saveSettings()
    return settings
  })

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Web Tool',
      submenu: [
        { label: 'Settings...', accelerator: 'CommandOrControl+,', click: openSettings },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' }
  ]))

  createMainWindow()
  createTray()
})

app.on('window-all-closed', () => app.quit())
