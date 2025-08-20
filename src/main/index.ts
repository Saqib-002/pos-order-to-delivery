import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';
import { initDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const { db } = await import('./db.js');
    return await db.post(order);
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
});

ipcMain.handle('get-orders', async () => {
  try {
    const { db } = await import('./db.js');
    return await db.allDocs({ include_docs: true });
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
});

ipcMain.handle('update-order', async (event, order) => {
  try {
    const { db } = await import('./db.js');
    return await db.put(order);
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
});

ipcMain.handle('get-order-by-id', async (event, id) => {
  try {
    const { db } = await import('./db.js');
    return await db.get(id);
  } catch (error) {
    console.error('Error getting order by id:', error);
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