import { BrowserWindow } from "electron";
import { OrderDatabaseOperations } from "../database/Orderoperations.js";
import { WebCustomerDatabaseOperations } from "../database/webCustomerOperations.js";
import { WebOrderAlertsOperations } from "../database/webOrderAlertsOperations.js";
import { syncLogger as Logger } from "./logger.js";
import { withSyncLock, waitForRound, WEB_ORDER_SYNC_LOCK } from "./sync/lock.js";

const REQUEST_TIMEOUT_MS = 15_000;

// The VPS requires the POS sync secret on the order sync endpoints.
function posSyncHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${process.env.DRIVER_SYNC_SECRET || ""}`, ...extra };
}

function notifyWindowsNewOrder(order: any, items: any[]) {
  try {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send("new-web-order", { order, items });
        win.webContents.send("order-change", {
          type: "insert",
          doc: { ...order, items },
        });
      }
    }
  } catch (err) {
    Logger.error("WebOrderSync: failed to broadcast new order to renderer:", err);
  }
}

// Sends the screen every web/app order that still needs its sound or receipt.
// Repeated after every sync tick until the screen records them as done, so an
// alert missed while starting up / logged out / printer unreachable is retried
// instead of lost. Only runs on the master POS (where this sync runs).
async function dispatchPendingAlerts(): Promise<void> {
  try {
    const pending = await WebOrderAlertsOperations.getPending();
    if (pending.length === 0) return;
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send("web-order-alert", pending);
    }
  } catch (err) {
    Logger.error("WebOrderSync: failed to dispatch pending order alerts:", err);
  }
}

async function syncWebOrders(): Promise<void> {
  const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";

  try {
    const response = await fetch(`${vpsUrl}/api/v1/orders/sync/pending`, {
      headers: posSyncHeaders(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      Logger.warn(`WebOrderSync: poll request failed — ${response.status} ${response.statusText}`);
      return;
    }

    const pendingOrders: any[] = await response.json();

    if (!Array.isArray(pendingOrders) || pendingOrders.length === 0) {
      return;
    }

    const processedIds: string[] = [];

    for (const item of pendingOrders) {
      const { order, items, customer } = item;
      try {
        if (customer) {
          await WebCustomerDatabaseOperations.upsertWebCustomer(customer);
        }
        const saveResult = await OrderDatabaseOperations.saveWebOrder(order, items);
        processedIds.push(order.id);
        const savedOrder = saveResult?.order || order;
        const savedItems = saveResult?.items || items;
        notifyWindowsNewOrder(savedOrder, savedItems);
        Logger.info(`WebOrderSync: Successfully synced web order ${order.id} (${order.ticketNumber}) locally.`);
      } catch (dbErr) {
        Logger.error(`WebOrderSync: failed to save web order ${order.id} locally:`, dbErr);
        // Do not acknowledge this specific order so it retries next tick
      }
    }

    if (processedIds.length > 0) {
      const ackResponse = await fetch(`${vpsUrl}/api/v1/orders/sync/acknowledge`, {
        method: "POST",
        headers: posSyncHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ids: processedIds }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!ackResponse.ok) {
        Logger.error(`WebOrderSync: Failed to acknowledge synced orders: ${ackResponse.statusText}`);
      } else {
        Logger.info(`WebOrderSync: Acknowledged sync for ${processedIds.length} orders.`);
      }
    }
  } catch (err) {
    Logger.error("WebOrderSync: network error during poll:", err);
  }
}

let syncInterval: NodeJS.Timeout | null = null;
let currentTick: Promise<void> | null = null;
let lockBusyLogged = false;

// One round: fetch new web orders, then sound/print alerts. Holds a database
// lock so that if two PCs are both set as master, only one fetches and prints.
async function runTick(): Promise<void> {
  const ran = await withSyncLock(WEB_ORDER_SYNC_LOCK, async () => {
    try {
      await syncWebOrders();
    } finally {
      await dispatchPendingAlerts();
    }
  });
  if (!ran && !lockBusyLogged) {
    Logger.warn("WebOrderSync: another master POS is already fetching web orders; this PC will wait");
  }
  lockBusyLogged = !ran;
}

async function syncTick(): Promise<void> {
  if (currentTick) return;
  currentTick = runTick().finally(() => {
    currentTick = null;
  });
  await currentTick;
}

export function startWebOrderSync(): void {
  if (syncInterval) return;
  Logger.info("WebOrderSync: starting background sync loop (10s interval)...");

  // Run once immediately on startup
  syncTick().catch((err) => Logger.error("WebOrderSync: initial sync error:", err));

  syncInterval = setInterval(() => {
    syncTick().catch((err) => Logger.error("WebOrderSync: sync tick error:", err));
  }, 10_000);
}

export async function stopWebOrderSync(): Promise<void> {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    Logger.info("WebOrderSync: stopped background sync loop.");
  }
  await waitForRound(currentTick);
}
