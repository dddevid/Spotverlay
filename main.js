const { app, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { execFile } = require('child_process');

const POLL_INTERVAL_MS = 1500;
const AUTO_HIDE_MS = 6000;
const OVERLAY_WIDTH = 340;
const OVERLAY_HEIGHT = 96;
const MARGIN = 16;
const WIN_WIDTH = OVERLAY_WIDTH + MARGIN;
const WIN_HEIGHT = OVERLAY_HEIGHT + MARGIN;
const APP_ICON = path.join(__dirname, 'assets', 'icon.png');

const SETTINGS_PATH = path.join(app.getPath('userData'), 'spotverlay-settings.json');

const DEFAULT_SETTINGS = {
  firstRun: true,
  alwaysOnTop: false,
  position: 'top-right',
  animation: 'fade',
};

let settings = { ...DEFAULT_SETTINGS };
let win = null;
let settingsWin = null;
let welcomeWin = null;
let tray = null;
let pollTimer = null;
let hideTimer = null;
let lastKey = null;
let lastPlaying = null;
let lastArtworkUrl = null;

function fetchArtwork(artist, title) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(`${artist} ${title}`);
    const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            let artworkUrl = json.results[0].artworkUrl100;
            if (artworkUrl) {
              artworkUrl = artworkUrl.replace('100x100bb', '600x600bb');
              resolve(artworkUrl);
              return;
            }
          }
        } catch (e) {}
        resolve(null);
      });
    }).on('error', () => resolve(null));
  });
}

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    settings = { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
  } catch {}
}

function getOverlayBounds() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  switch (settings.position) {
    case 'top-left':
      return { x: 0, y: 0, width: WIN_WIDTH, height: WIN_HEIGHT };
    case 'bottom-left':
      return { x: 0, y: screenH - WIN_HEIGHT, width: WIN_WIDTH, height: WIN_HEIGHT };
    case 'bottom-right':
      return { x: screenW - WIN_WIDTH, y: screenH - WIN_HEIGHT, width: WIN_WIDTH, height: WIN_HEIGHT };
    case 'top-right':
    default:
      return { x: screenW - WIN_WIDTH, y: 0, width: WIN_WIDTH, height: WIN_HEIGHT };
  }
}

function applyOverlaySettings() {
  if (!win) return;
  const bounds = getOverlayBounds();
  win.setBounds(bounds);
  win.setAlwaysOnTop(true, 'screen-saver');
  win.webContents.send('settings-updated', settings);
  if (!settings.alwaysOnTop) {
    scheduleHide();
  } else {
    clearTimeout(hideTimer);
  }
}

function createOverlayWindow() {
  const bounds = getOverlayBounds();

  win = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, 'renderer', 'overlay.html'));

  win.on('closed', () => {
    win = null;
  });
}

function createSettingsWindow() {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.focus();
    return;
  }

  settingsWin = new BrowserWindow({
    width: 460,
    height: 500,
    title: 'Spotverlay – Settings',
    icon: APP_ICON,
    resizable: false,
    maximizable: false,
    skipTaskbar: false,
    alwaysOnTop: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWin.setMenuBarVisibility(false);
  settingsWin.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  settingsWin.once('ready-to-show', () => settingsWin.show());
  settingsWin.on('closed', () => {
    settingsWin = null;
  });
}

function createWelcomeWindow() {
  welcomeWin = new BrowserWindow({
    width: 500,
    height: 460,
    title: 'Welcome to Spotverlay',
    icon: APP_ICON,
    resizable: false,
    maximizable: false,
    skipTaskbar: false,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  welcomeWin.setMenuBarVisibility(false);
  welcomeWin.loadFile(path.join(__dirname, 'renderer', 'welcome.html'));
  welcomeWin.once('ready-to-show', () => welcomeWin.show());
  welcomeWin.on('closed', () => {
    welcomeWin = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  let icon = nativeImage.createFromPath(iconPath);
  if (!icon.isEmpty()) {
    icon = icon.resize({ width: 16, height: 16 });
  }
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip('Spotverlay');

  const menu = Menu.buildFromTemplate([
    { label: 'Settings', click: () => createSettingsWindow() },
    { type: 'separator' },
    { label: 'Exit', click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
}

function showOverlay() {
  if (win) {
    win.webContents.send('show-card');
  }
}

function scheduleHide() {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (win && !settings.alwaysOnTop) {
      win.webContents.send('hide-card');
    }
  }, 4000);
}

function getScriptPath() {
  const isAsar = __dirname.includes('app.asar');
  if (isAsar) {
    return path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), 'scripts', 'now-playing.ps1');
  }
  return path.join(__dirname, 'scripts', 'now-playing.ps1');
}

function pollNowPlaying() {
  const scriptPath = getScriptPath();
  execFile(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
    { windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
    (err, stdout) => {
      if (err || !stdout) return;
      let data;
      try {
        data = JSON.parse(stdout.trim());
      } catch {
        return;
      }
      if (!data.found) return;

      const key = `${data.artist || ''}|${data.title || ''}`;
      const isPlayingChanged = data.playing !== lastPlaying;
      const changed = key !== lastKey || isPlayingChanged;
      lastKey = key;
      lastPlaying = data.playing;

      const sendData = (artworkUrl) => {
        data.thumbnailUrl = artworkUrl;
        if (!win) return;
        win.webContents.send('now-playing', data);

        if (changed || settings.alwaysOnTop) {
          showOverlay();
          if (!settings.alwaysOnTop) scheduleHide();
        }
      };

      if (changed && data.title) {
        fetchArtwork(data.artist || '', data.title).then(url => {
          lastArtworkUrl = url;
          sendData(url);
        });
      } else {
        sendData(lastArtworkUrl);
      }
    }
  );
}

ipcMain.handle('get-settings', () => ({ ...settings }));

ipcMain.handle('save-settings', (_event, newSettings) => {
  settings = { ...settings, ...newSettings };
  saveSettings();
  applyOverlaySettings();
});

ipcMain.handle('complete-first-run', () => {
  settings.firstRun = false;
  saveSettings();
  if (welcomeWin && !welcomeWin.isDestroyed()) {
    welcomeWin.close();
  }
});

app.whenReady().then(() => {
  app.setAppUserModelId('com.spotverlay.app');
  loadSettings();
  createOverlayWindow();
  createTray();

  if (settings.firstRun) {
    createWelcomeWindow();
  }

  pollTimer = setInterval(pollNowPlaying, POLL_INTERVAL_MS);
  pollNowPlaying();
});

app.on('window-all-closed', () => {
  clearInterval(pollTimer);
});

app.on('before-quit', () => {
  clearInterval(pollTimer);
});