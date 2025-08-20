import { app, BrowserWindow } from 'electron';
import { initDB } from './db.js';
import { createWindow } from './window.js';
import { registerIpcHandlers } from './ipcHandlers.js';

// Initialize and register everything
app.whenReady().then(() => {
  // Initialize the database first
  initDB();

  // Register all IPC handlers
  registerIpcHandlers();

  // Create the main window
  createWindow();

  // Handle app activation on macOS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});