import { BrowserWindow } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';
import { syncManager } from './database/sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  // Setup sync status monitoring
  setupSyncMonitoring(win);

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  return win;
}

function setupSyncMonitoring(win: BrowserWindow) {
  // Listen for sync events and forward to renderer
  syncManager.on('sync-success', () => {
    if (!win.isDestroyed()) {
      win.webContents.send('sync-status', { 
        status: 'success', 
        timestamp: new Date(),
        message: 'Data synchronized successfully'
      });
    }
  });

  syncManager.on('sync-failed', (error) => {
    if (!win.isDestroyed()) {
      win.webContents.send('sync-status', { 
        status: 'failed', 
        timestamp: new Date(),
        error: error.message 
      });
    }
  });

  // Clean up listeners when window is closed
  win.on('closed', () => {
    syncManager.removeAllListeners();
  });
}
