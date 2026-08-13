import { WebCustomerDatabaseOperations, WebCustomer } from "../../database/webCustomerOperations.js";
import Logger from "electron-log";
import Store from "electron-store";

interface SyncCursorSchema {
  webCustomerSyncCursor: string | null;
}

/**
 * Dedicated store for persisting the web-customer sync cursor across restarts.
 * Stored separately from the main app store to keep concerns isolated.
 */
const syncCursorStore = new Store<SyncCursorSchema>({
  name: "sync-cursors",
  defaults: {
    webCustomerSyncCursor: null,
  },
});

function getLastSyncedAt(): string | null {
  return (syncCursorStore as any).get("webCustomerSyncCursor") ?? null;
}

function setLastSyncedAt(value: string | null): void {
  (syncCursorStore as any).set("webCustomerSyncCursor", value);
}

/**
 * One sync tick: fetch web customers updated since lastSyncedAt from the VPS,
 * upsert them into the local DB, then advance the cursor.
 */
async function syncWebCustomers(): Promise<void> {
  const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
  const lastSyncedAt = getLastSyncedAt();

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
    setLastSyncedAt(latestUpdatedAt);
    Logger.info(`WebCustomerSync: synced ${customers.length} web customer(s). Cursor → ${latestUpdatedAt}`);
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
  }, 120_000);
}
