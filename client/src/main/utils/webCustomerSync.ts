import { WebCustomerDatabaseOperations, WebCustomer } from "../database/webCustomerOperations.js";
import Logger from "electron-log";

// Persists the last-synced timestamp in memory between ticks.
// On restart it falls back to null and does a full pull (safe — upsert handles duplicates).
let lastSyncedAt: string | null = null;

/**
 * One sync tick: fetch web customers updated since lastSyncedAt from the VPS,
 * upsert them into the local DB, then advance the cursor.
 */
async function syncWebCustomers(): Promise<void> {
  const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";

  try {
    const qs = lastSyncedAt
      ? `?since=${encodeURIComponent(lastSyncedAt)}`
      : "";

    const response = await fetch(`${vpsUrl}/api/v1/customers/poll${qs}`);

    if (!response.ok) {
      Logger.warn(`WebCustomerSync: poll request failed — ${response.status} ${response.statusText}`);
      return;
    }

    const customers: WebCustomer[] = await response.json();

    if (!Array.isArray(customers) || customers.length === 0) {
      return;
    }

    let latestUpdatedAt = lastSyncedAt;

    for (const customer of customers) {
      try {
        await WebCustomerDatabaseOperations.upsertWebCustomer(customer);

        // Track the newest updatedAt seen in this batch
        if (!latestUpdatedAt || customer.updatedAt > latestUpdatedAt) {
          latestUpdatedAt = customer.updatedAt;
        }
      } catch (dbErr) {
        Logger.error(`WebCustomerSync: failed to upsert customer ${customer.id}:`, dbErr);
        // Continue processing the rest of the batch; don't advance the cursor
        // past a failed record — the next tick will re-fetch and retry.
        return;
      }
    }

    // Advance cursor only after the entire batch is saved successfully
    lastSyncedAt = latestUpdatedAt;
    Logger.info(`WebCustomerSync: synced ${customers.length} web customer(s). Cursor → ${lastSyncedAt}`);
  } catch (err) {
    Logger.error("WebCustomerSync: network error during poll:", err);
  }
}

/**
 * Starts the dedicated web-customer sync loop on a 30-second interval.
 * Kept separate from the 10-second order-status poll intentionally.
 */
export function startWebCustomerSync(): void {
  Logger.info("WebCustomerSync: starting background sync loop (30s interval)...");

  // Run once immediately on startup so the table is populated without waiting
  syncWebCustomers().catch((err) =>
    Logger.error("WebCustomerSync: initial sync error:", err)
  );

  setInterval(() => {
    syncWebCustomers().catch((err) =>
      Logger.error("WebCustomerSync: sync tick error:", err)
    );
  }, 30_000);
}
