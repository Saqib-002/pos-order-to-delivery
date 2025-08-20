import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';
import { db } from './db.js'; // Import the db instance
import Logger from 'electron-log';

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

  startDbChangesFeed(win);

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  return win;
}

function startDbChangesFeed(win:BrowserWindow) {
  let changes:PouchDB.Core.Changes<{}> |null = db.changes({
    since: 'now',
    live: true,
    include_docs: true,
  })
  .on('change', (change) => {
    if (!win.isDestroyed()) {
      win.webContents.send('db-change', change);
    }
  })
  .on('error', (err) => {
    Logger.error('Changes feed error:', err);
  });

  win.on('closed', () => {
    if (changes) {
      changes.cancel();
      changes = null;
    }
  });
}