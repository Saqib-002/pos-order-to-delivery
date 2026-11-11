import { db } from "../database/index.js";
import { syncLogger as Logger } from "./logger.js";

const INTERVAL_MS = 30_000;

async function pushKitchenStatus(): Promise<void> {
  const vpsUrl = process.env.SERVER_API_URL || "http://localhost:3002";
  const vpsUrlSuffix = process.env.SERVER_API_URL_SUFFIX || "http://localhost:3002";
  const secret = process.env.SERVER_SYNC_SECRET || "";

  try {
    const result = await db("orders")
      .whereRaw(`LOWER("status") = LOWER(?)`, ["sent to kitchen"])
      .count("* as count")
      .first();
    const count = parseInt(result?.count?.toString() || "0", 10);

    const response = await fetch(`${vpsUrl}/${vpsUrlSuffix}/kitchen/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`,
      },
      body: JSON.stringify({ count }),
    });

    if (!response.ok) {
      Logger.warn(`KitchenStatusSync: push failed — ${response.status} ${response.statusText}`);
    }
  } catch (err) {
    Logger.warn(`KitchenStatusSync: push error — ${String(err)}`);
  }
}

let kitchenInterval: NodeJS.Timeout | null = null;

export function startKitchenStatusSync(): void {
  if (kitchenInterval) return;
  Logger.info(`KitchenStatusSync: starting background push loop (${INTERVAL_MS / 1000}s interval)...`);

  pushKitchenStatus().catch((err) =>
    Logger.error("KitchenStatusSync: initial push error:", err)
  );

  kitchenInterval = setInterval(() => {
    pushKitchenStatus().catch((err) =>
      Logger.error("KitchenStatusSync: push tick error:", err)
    );
  }, INTERVAL_MS);
}

export function stopKitchenStatusSync(): void {
  if (kitchenInterval) {
    clearInterval(kitchenInterval);
    kitchenInterval = null;
    Logger.info("KitchenStatusSync: stopped background push loop.");
  }
}
