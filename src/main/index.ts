import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';
import { remoteDB,db,initDB } from './db.js';
import Logger from 'electron-log';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let changes: any=null;
function createWindow() {
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

  // Start changes feed
  changes = db.changes({
    since: 'now',
    live: true,
    include_docs: true,
  })
    .on('change', (change) => {
      // Send change event to renderer
      win.webContents.send('db-change', change);
    })
    .on('error', (err) => {
      Logger.error('Changes feed error:', err);
    });
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // In production, load the built files
    const indexPath = path.join(__dirname, '../../dist/index.html');
    win.loadFile(indexPath);
  }
}

// IPC handlers - we'll import db dynamically to avoid circular imports
ipcMain.handle('save-order', async (event, order) => {
  try {
    return await db.post(order);
  } catch (error) {
    Logger.error('Error saving order:', error);
    throw error;
  }
});

ipcMain.handle('get-orders', async () => {
  try {
    return await db.allDocs({ include_docs: true });
  } catch (error) {
    Logger.error('Error getting orders:', error);
    throw error;
  }
});

ipcMain.handle('update-order', async (event, order) => {
  try {
    return await db.put(order);
  } catch (error) {
    Logger.error('Error updating order:', error);
    throw error;
  }
});

ipcMain.handle('get-order-by-id', async (event, id) => {
  try {
    return await db.get(id);
  } catch (error) {
    Logger.error('Error getting order by id:', error);
    throw error;
  }
});
app.whenReady().then(() => {
  initDB();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});