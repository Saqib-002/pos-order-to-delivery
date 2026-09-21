import { BrowserWindow } from "electron";
import { OrderDatabaseOperations } from "../database/Orderoperations.js";
import { WebCustomerDatabaseOperations } from "../database/webCustomerOperations.js";
import Logger from "electron-log";

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

async function syncWebOrders(): Promise<void> {
  const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";

  try {
    const response = await fetch(`${vpsUrl}/api/v1/orders/sync/pending`);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: processedIds }),
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

export function startWebOrderSync(): void {
  if (syncInterval) return;
  Logger.info("WebOrderSync: starting background sync loop (10s interval)...");

  // Run once immediately on startup
  syncWebOrders().catch((err) =>
    Logger.error("WebOrderSync: initial sync error:", err)
  );

  syncInterval = setInterval(() => {
    syncWebOrders().catch((err) =>
      Logger.error("WebOrderSync: sync tick error:", err)
    );
  }, 10_000);
}

export function stopWebOrderSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    Logger.info("WebOrderSync: stopped background sync loop.");
  }
}
