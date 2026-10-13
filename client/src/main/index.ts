import { app, BrowserWindow, session } from "electron";
import { createWindow } from "./window.js";
import { registerIpcHandlers } from "./ipcHandlers.js";
import { initDatabase, closeDatabase } from "./database/index.js";
import Logger from "electron-log";
import path from "path";
import dotenv from "dotenv";

const isPackaged = app.isPackaged;
if (isPackaged) {
  dotenv.config({ path: path.join(process.resourcesPath, ".env") });
} else {
  dotenv.config();
}

app.whenReady().then(async () => {
  try {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = { ...(details.responseHeaders || {}) };
      let existingOriginHeader: string[] | undefined;
      for (const key of Object.keys(responseHeaders)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === "access-control-allow-origin") {
          existingOriginHeader = responseHeaders[key];
          delete responseHeaders[key];
        } else if (lowerKey === "cross-origin-resource-policy") {
          delete responseHeaders[key];
        }
      }

      const originValue =
        existingOriginHeader && existingOriginHeader.length > 0 && existingOriginHeader[0]
          ? [existingOriginHeader[0].split(",")[0].trim()]
          : ["*"];

      responseHeaders["Access-Control-Allow-Origin"] = originValue;
      responseHeaders["Cross-Origin-Resource-Policy"] = ["cross-origin"];
      callback({ responseHeaders });
    });

    registerIpcHandlers();
    const iconPath = path.join(app.getAppPath(), "logo.png");
    createWindow(iconPath);
  } catch (error) {
    Logger.error("Application initialization failed:", error);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const iconPath = path.join(app.getAppPath(), "logo.png");
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
