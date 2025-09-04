import { app, BrowserWindow } from "electron";
import { createWindow } from "./window.js";
import { registerIpcHandlers } from "./ipcHandlers.js";
import { initDatabase } from "./database/index.js";
import { syncManager } from "./database/sync.js";
import Logger from "electron-log";

// Initialize and register everything
app.whenReady().then(async () => {
    try {
        // Initialize the database first
        await initDatabase();

        // Register all IPC handlers
        registerIpcHandlers();

        // Create the main window
        createWindow();
        // Setup sync event listeners
        syncManager.on("sync-success", () => {
            Logger.info("Sync completed successfully");
            // Notify renderer process about successful sync
            BrowserWindow.getAllWindows().forEach((win) => {
                if (!win.isDestroyed()) {
                    win.webContents.send("sync-status", {
                        status: "success",
                        timestamp: new Date(),
                        message: "Data synchronized successfully"
                    });
                }
            });
        });
        syncManager.on("sync-failed", (error) => {
            Logger.error("Sync failed:", error);
            // Notify renderer process about sync failure
            BrowserWindow.getAllWindows().forEach((win) => {
                if (!win.isDestroyed()) {
                    win.webContents.send("sync-status", {
                        status: "failed",
                        timestamp: new Date(),
                        error: error.message,
                    });
                }
            });
        });
    } catch (error) {
        Logger.error("Application initialization failed:", error);
        app.quit();
    }

    // Handle app activation on macOS
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit the app when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        syncManager.destroy();
        app.quit();
    }
});
app.on("before-quit", () => {
    Logger.info("Application shutting down, stopping sync manager...");
    syncManager.destroy();
});

app.on("will-quit", (event) => {
    // Give sync manager time to cleanup
    if (syncManager.getSyncStatus().inProgress) {
        event.preventDefault();
        setTimeout(() => {
            syncManager.destroy();
            app.quit();
        }, 2000);
    }
});