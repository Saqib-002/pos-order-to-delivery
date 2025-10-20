import { app, BrowserWindow } from "electron";
import { createWindow } from "./window.js";
import { registerIpcHandlers } from "./ipcHandlers.js";
import { initDatabase,closeDatabase } from "./database/index.js";
import Logger from "electron-log";
import path from "path";
app.whenReady().then(async () => {
    try {
        // Initialize the database
        await initDatabase();

        // Register all IPC handlers
        registerIpcHandlers();
        const iconPath = path.join(app.getAppPath(), 'logo.png');
        // Create the main window
        createWindow(iconPath);
    } catch (error) {
        Logger.error("Application initialization failed:", error);
        app.quit();
    }
    
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            const iconPath = path.join(app.getAppPath(), 'logo.png');
            createWindow(iconPath);
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        closeDatabase().then(() => {
            app.quit();
        });
    }
});

app.on("before-quit", async () => {
    Logger.info("Application shutting down, closing database...");
    await closeDatabase();
});