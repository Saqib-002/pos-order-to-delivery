import { IpcMainInvokeEvent } from "electron";
import {
  WebOrderAlertsOperations,
  MAX_AUTO_PRINT_ATTEMPTS,
} from "../database/webOrderAlertsOperations.js";
import Logger from "electron-log";
import { verifyToken } from "./auth.js";

// The screen reports what happened for one web/app order alert:
//   { notified: true }               sound was played
//   { printed: true }                receipt printed
//   { printed: false, error: "…" }   print failed (retried until the limit)
export const markWebOrderAlert = async (
  event: IpcMainInvokeEvent,
  token: string,
  orderId: string,
  result: { notified?: boolean; printed?: boolean; error?: string }
) => {
  try {
    await verifyToken(event, token);
    if (result?.notified) {
      await WebOrderAlertsOperations.markNotified(orderId);
    }
    let attempts = 0;
    if (result?.printed === true) {
      await WebOrderAlertsOperations.markPrinted(orderId);
    } else if (result?.printed === false) {
      attempts = await WebOrderAlertsOperations.markPrintFailed(
        orderId,
        result.error || ""
      );
      Logger.warn(
        `Web order ${orderId}: auto-print failed (attempt ${attempts}/${MAX_AUTO_PRINT_ATTEMPTS}): ${result.error}`
      );
    }
    return {
      status: true,
      data: { attempts, maxAttempts: MAX_AUTO_PRINT_ATTEMPTS },
    };
  } catch (error) {
    Logger.error("Error recording web order alert:", error);
    return { status: false, error: (error as Error).message };
  }
};
