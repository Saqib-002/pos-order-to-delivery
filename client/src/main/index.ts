import * as Sentry from "@sentry/electron/main";
import { app, BrowserWindow, session } from "electron";
import { createWindow } from "./window.js";
import { registerIpcHandlers } from "./ipcHandlers.js";
import { initDatabase, closeDatabase } from "./database/index.js";
import Logger from "electron-log";
import path from "path";
import dotenv from "dotenv";
import os from "os";

const isPackaged = app.isPackaged;
if (isPackaged) {
  dotenv.config({ path: path.join(process.resourcesPath, ".env") });
} else {
  dotenv.config();
}

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://c4a321d596ed8726ce01949d87dc0d84@o4508920124276736.ingest.us.sentry.io/4512271446900736",
  environment: process.env.NODE_ENV || (isPackaged ? "production" : "development"),
  tracesSampleRate: 0,
  ignoreErrors: [
    "fetch failed",
    "ECONNRESET",
    "ENOTFOUND",
    "ETIMEDOUT",
    "aborted",
    "NetworkError",
    "Failed to fetch",
  ],
});

try {
  const hostname = os.hostname();
  const username = os.userInfo().username;
  Sentry.setTag("hostname", hostname);
  Sentry.setTag("os_user", username);
  Sentry.setContext("device", {
    name: hostname,
    os_user: username,
    platform: process.platform,
    arch: process.arch,
    release: os.release(),
  });
} catch {
  // Ignore device info error
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
