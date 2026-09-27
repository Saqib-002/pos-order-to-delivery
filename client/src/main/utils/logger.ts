import Logger from "electron-log";

// Main default logger -> writes to main.log
export const mainLogger = Logger;

// Dedicated printer logger -> writes to printer.log
export const printerLogger = Logger.create({ logId: "printer" });
if (printerLogger.transports?.file) {
  printerLogger.transports.file.fileName = "printer.log";
}

// Dedicated sync logger -> writes to sync.log
export const syncLogger = Logger.create({ logId: "sync" });
if (syncLogger.transports?.file) {
  syncLogger.transports.file.fileName = "sync.log";
}

export default Logger;
