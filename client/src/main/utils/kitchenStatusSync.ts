import { db } from "../database/index.js";
import Logger from "electron-log";

const INTERVAL_MS = 20_000; // 20 seconds

async function pushKitchenStatus(): Promise<void> {
  const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
  const secret = process.env.DRIVER_SYNC_SECRET || "";

  try {
    const result = await db("orders")
      .whereRaw(`LOWER("status") = LOWER(?)`, ["sent to kitchen"])
      .count("* as count")
      .first();
    const count = parseInt(result?.count?.toString() || "0", 10);

    const response = await fetch(`${vpsUrl}/api/v1/kitchen/status`, {
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
