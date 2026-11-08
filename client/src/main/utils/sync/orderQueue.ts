import fs from "fs";
import os from "os";
import path from "path";
import { app } from "electron";
import { db } from "../../database/index.js";
import { syncLogger as Logger } from "../logger.js";
import { readQueue, writeQueue } from "./queue/db.js";
import { withSyncLock, waitForRound, ORDER_SYNC_QUEUE_LOCK } from "./lock.js";

/**
 * Shared outbox for web/app order status updates (table `order_sync_queue`).
 *
 * - Any POS (master or client) can add updates with `enqueueOrderStatus`.
 * - Only the master POS sends them, oldest first, one at a time, so the website
 *   receives them in the same order they were saved.
 * - The send order is the row id the database assigns, never a PC clock.
 */

const TABLE = "order_sync_queue";
const SEND_INTERVAL_MS = 30_000;
const BATCH_SIZE = 50;
const REQUEST_TIMEOUT_MS = 15_000;

export async function enqueueOrderStatus(orderId: string, payload: Record<string, unknown>): Promise<void> {
  const deviceName = os.hostname();
  await db(TABLE).insert({
    orderId,
    payload: JSON.stringify(payload),
    deviceName,
  });
  Logger.info(`OrderSyncQueue: queued '${payload.status}' for order ${orderId} (device: ${deviceName})`);
}

// Network/server problems are retried. Everything else the VPS refuses
// (e.g. 404 order not found, 400 bad data) would never succeed, so it is set aside.
function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 401 || status === 403 || status === 408 || status === 429;
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "";
  }
}

async function recordFailure(id: number, attempts: number, error: string, park: boolean): Promise<void> {
  await db(TABLE)
    .where({ id })
    .update({
      attempts: attempts + 1,
      lastError: error.slice(0, 1000),
      lastAttemptAt: db.fn.now(),
      ...(park ? { parkedAt: db.fn.now() } : {}),
    });
}

async function sendPendingOrderUpdates(): Promise<void> {
  const rows = await db(TABLE).whereNull("parkedAt").orderBy("id", "asc").limit(BATCH_SIZE);
  if (rows.length === 0) return;

  const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
  const secret = process.env.DRIVER_SYNC_SECRET || "";
  let sent = 0;

  for (const row of rows) {
    const label = `#${row.id} order ${row.orderId} (from ${row.deviceName || "unknown device"})`;
    let response: Response;
    try {
      response = await fetch(`${vpsUrl}/api/v1/orders/${encodeURIComponent(row.orderId)}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
        body: row.payload,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      await recordFailure(row.id, row.attempts, String(err), false);
      Logger.warn(`OrderSyncQueue: ${label} not sent (${String(err)}), will retry`);
      break; // keep the order: nothing behind it is sent before it
    }

    if (response.ok) {
      await db(TABLE).where({ id: row.id }).delete();
      sent++;
      continue;
    }

    const error = `HTTP ${response.status} ${await readErrorBody(response)}`.trim();
    if (isRetryableStatus(response.status)) {
      await recordFailure(row.id, row.attempts, error, false);
      Logger.warn(`OrderSyncQueue: ${label} not sent (${error}), will retry`);
      break;
    }

    await recordFailure(row.id, row.attempts, error, true);
    Logger.error(`OrderSyncQueue: ${label} rejected by the server and set aside (${error})`);
  }

  if (sent > 0) {
    Logger.info(`OrderSyncQueue: sent ${sent} order update(s)`);
  }
}

let sendInterval: NodeJS.Timeout | null = null;
let currentRound: Promise<void> | null = null;

/** One send round. Skipped if a round is still running or another POS holds the lock. */
export async function processOrderSyncQueue(): Promise<void> {
  if (currentRound) return;
  currentRound = withSyncLock(ORDER_SYNC_QUEUE_LOCK, sendPendingOrderUpdates)
    .then(() => undefined)
    .finally(() => {
      currentRound = null;
    });
  await currentRound;
}

/** Start sending. Master POS only (called from startCloudSyncServices). */
export function startOrderSyncQueue(): void {
  if (sendInterval) return;
  Logger.info(`OrderSyncQueue: sender started (every ${SEND_INTERVAL_MS / 1000}s)`);
  sendInterval = setInterval(() => {
    processOrderSyncQueue().catch((err) => Logger.error("OrderSyncQueue: send round failed:", err));
  }, SEND_INTERVAL_MS);
}

/** Stop sending, and give a round that is still running time to finish. */
export async function stopOrderSyncQueue(): Promise<void> {
  if (sendInterval) {
    clearInterval(sendInterval);
    sendInterval = null;
    Logger.info("OrderSyncQueue: sender stopped");
  }
  await waitForRound(currentRound);
}

/**
 * Older app versions kept order status updates in each PC's local queue file.
 * On a client POS those were never sent. Sending them now would push stale
 * statuses (e.g. "sent to kitchen" for orders delivered days ago), so they are
 * saved to a backup file in the app data folder and removed from the local
 * queue, without being sent. Menu/settings jobs in the local queue are untouched.
 */
export function backupLegacyOrderStatusJobs(): void {
  try {
    const jobs = readQueue();
    const legacy = jobs.filter((job) => job.entity === "orderstatus");
    if (legacy.length === 0) return;

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = path.join(app.getPath("userData"), `order-status-backup-${stamp}.json`);
    fs.writeFileSync(file, JSON.stringify(legacy, null, 2), "utf-8");

    writeQueue(jobs.filter((job) => job.entity !== "orderstatus"));
    Logger.warn(
      `OrderSyncQueue: ${legacy.length} old unsent order update(s) from the local queue saved to ${file} (not sent)`
    );
  } catch (err) {
    Logger.error("OrderSyncQueue: could not back up old local order updates:", err);
  }
}
