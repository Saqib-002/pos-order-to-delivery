import os from "os";
import { db } from "../../../database/index.js";
import { syncLogger as Logger } from "../../logger.js";
import { withSyncLock, waitForRound, DRIVER_ORDER_SYNC_QUEUE_LOCK } from "../lock.js";
import { processDeliveryPersonSyncQueue } from "./deliveryPersonQueue.js";

const TABLE = "driver_order_sync_queue";
const SEND_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 15_000;
const BATCH_SIZE = 50;

function isDeliveryOrder(order: any): boolean {
  return Boolean(order.deliveryPersonId) || String(order.orderType || "").toLowerCase().includes("delivery");
}

/** Capture a complete order+items snapshot in the shared database outbox. */
export async function enqueueDriverOrderSnapshot(orderId: string): Promise<void> {
  const order = await db("orders").where({ id: orderId }).first();
  if (!order || !isDeliveryOrder(order)) return;
  const items = await db("order_items").where({ orderId });
  await db(TABLE).insert({
    orderId,
    payload: JSON.stringify({ order, items }),
    deviceName: os.hostname(),
  });
  Logger.info(`DriverOrderSyncQueue: queued snapshot for delivery order ${orderId} (${items.length} items)`);
}

function retryable(status: number): boolean {
  return status === 424 || status >= 500 || status === 401 || status === 403 || status === 408 || status === 429;
}

async function recordFailure(id: number, attempts: number, error: string, park: boolean) {
  await db(TABLE).where({ id }).update({
    attempts: attempts + 1,
    lastError: error.slice(0, 1000),
    lastAttemptAt: db.fn.now(),
    ...(park ? { parkedAt: db.fn.now() } : {}),
  });
}

async function sendPendingSnapshots(): Promise<void> {
  const rows = await db(TABLE).whereNull("parkedAt").orderBy("id", "asc").limit(BATCH_SIZE);
  const apiUrl = (process.env.SERVER_API_URL || "http://localhost:3002").replace(/\/$/, "");
  const apiUrlSuffix = (process.env.SERVER_API_URL_SUFFIX || "http://localhost:3002").replace(/\/$/, "");
  const secret = process.env.SERVER_SYNC_SECRET || "";
  for (const row of rows) {
    let response: Response;
    try {
      response = await fetch(`${apiUrl}/${apiUrlSuffix}/driver/pos/orders/${encodeURIComponent(row.orderId)}/sync`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
        body: row.payload,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      await recordFailure(row.id, row.attempts, String(error), false);
      Logger.warn(`DriverOrderSyncQueue: order ${row.orderId} failed to send; will retry (${String(error)})`);
      break;
    }
    if (response.ok) {
      await db(TABLE).where({ id: row.id }).delete();
      Logger.info(`DriverOrderSyncQueue: order ${row.orderId} synced successfully (HTTP ${response.status})`);
      continue;
    }
    let body = "";
    try { body = (await response.text()).slice(0, 500); } catch {}
    const message = `HTTP ${response.status} ${body}`.trim();
    await recordFailure(row.id, row.attempts, message, !retryable(response.status));
    Logger[retryable(response.status) ? "warn" : "error"](`DriverOrderSyncQueue: order ${row.orderId} rejected (${message})${retryable(response.status) ? "; will retry" : "; parked"}`);
    if (retryable(response.status)) break;
  }
}

let interval: NodeJS.Timeout | null = null;
let currentRound: Promise<void> | null = null;

export async function processDriverOrderSyncQueue(): Promise<void> {
  if (currentRound) return;
  currentRound = (async () => {
    // Ensure referenced driver profiles reach the server before order upserts.
    await processDeliveryPersonSyncQueue();
    await withSyncLock(DRIVER_ORDER_SYNC_QUEUE_LOCK, sendPendingSnapshots);
  })().then(() => undefined).finally(() => { currentRound = null; });
  await currentRound;
}

export function startDriverOrderSyncQueue(): void {
  if (interval) return;
  Logger.info(`DriverOrderSyncQueue: sender started (every ${SEND_INTERVAL_MS / 1000}s)`);
  processDriverOrderSyncQueue().catch((err) => Logger.error("DriverOrderSyncQueue: initial round failed:", err));
  interval = setInterval(() => processDriverOrderSyncQueue().catch((err) => Logger.error("DriverOrderSyncQueue: round failed:", err)), SEND_INTERVAL_MS);
}

export async function stopDriverOrderSyncQueue(): Promise<void> {
  if (interval) { clearInterval(interval); interval = null; }
  await waitForRound(currentRound);
}
