import { app, BrowserWindow } from "electron";
import { createWindow } from "./window.js";
import { registerIpcHandlers } from "./ipcHandlers.js";
import { initDatabase,closeDatabase } from "./database/index.js";
import Logger from "electron-log";
app.whenReady().then(async () => {
    try {
        // Initialize the database
        await initDatabase();

        // Register all IPC handlers
        registerIpcHandlers();

        // Create the main window
        createWindow();
    } catch (error) {
        Logger.error("Application initialization failed:", error);
        app.quit();
    }

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
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