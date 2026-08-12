import { OrderDatabaseOperations } from "../database/Orderoperations.js";
import Logger from "electron-log";

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
      const { order, items } = item;
      try {
        await OrderDatabaseOperations.saveWebOrder(order, items);
        processedIds.push(order.id);
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

export function startWebOrderSync(): void {
  Logger.info("WebOrderSync: starting background sync loop (10s interval)...");

  // Run once immediately on startup
  syncWebOrders().catch((err) =>
    Logger.error("WebOrderSync: initial sync error:", err)
  );

  setInterval(() => {
    syncWebOrders().catch((err) =>
      Logger.error("WebOrderSync: sync tick error:", err)
    );
  }, 10_000);
}
