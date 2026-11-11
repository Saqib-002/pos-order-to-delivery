import { BrowserWindow } from "electron";
import { db } from "../database/index.js";
import { syncLogger as Logger } from "./logger.js";
import { withSyncLock, waitForRound, DRIVER_ORDER_STATUS_SYNC_LOCK } from "./sync/lock.js";

const POLL_INTERVAL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 15_000;
const BATCH_SIZE = 250;

type DriverOrderStatus = {
  id: string;
  status: "delivered" | "cancelled" | "canceled";
  deliveredAt?: string | null;
  cancelAt?: string | null;
  notes?: string | null;
  isPaid?: boolean;
  updatedAt?: string | null;
};

function isDeliveryOrder(order: any): boolean {
  return Boolean(order.deliveryPersonId) || String(order.orderType || "").toLowerCase().includes("delivery");
}

function addCancellationReason(existingNotes: string | null | undefined, serverNotes: string | null | undefined): string | undefined {
  const incoming = String(serverNotes || "").trim();
  if (!incoming) return existingNotes || undefined;
  const existing = String(existingNotes || "").trim();
  if (!existing) return incoming;
  if (existing.includes(incoming)) return existing;

  // Driver server prefixes cancellation reason with a timestamp. Extract the
  // actual reason before appending so old local notes remain intact.
  const match = incoming.match(/^\[CANCELLED:\s*[^\]]+\]\s*([\s\S]*)$/i);
  const reason = match?.[1]?.trim() || incoming;
  if (existing.includes(reason)) return existing;
  return `${existing}\n\n${incoming}`;
}

async function applyStatusUpdates(updates: DriverOrderStatus[]): Promise<string[]> {
  const applied: string[] = [];
  for (const update of updates) {
    const status = String(update.status || "").toLowerCase();
    if (!update.id || !["delivered", "cancelled", "canceled"].includes(status)) continue;

    await db.transaction(async (trx) => {
      const local = await trx("orders").where({ id: update.id }).forUpdate().first();
      // Still require an eligible local order. A reassignment/cancellation made
      // locally while the request was in flight should not be overwritten.
      if (!local || String(local.status || "").toLowerCase() !== "out for delivery" || !isDeliveryOrder(local) || !local.deliveryPersonId) return;

      const canonicalStatus = status === "canceled" ? "cancelled" : status;
      const patch: Record<string, unknown> = {
        status: canonicalStatus,
        updatedAt: update.updatedAt || new Date().toISOString(),
      };
      if (canonicalStatus === "delivered") {
        if (update.deliveredAt) patch.deliveredAt = update.deliveredAt;
        // Keep existing driver-server behavior per product decision.
        patch.isPaid = update.isPaid ?? true;
      } else {
        if (update.cancelAt) patch.cancelAt = update.cancelAt;
        const mergedNotes = addCancellationReason(local.notes, update.notes);
        if (mergedNotes !== undefined) patch.notes = mergedNotes;
      }

      await trx("orders").where({ id: update.id }).update(patch);
      applied.push(update.id);
    });
  }
  return applied;
}

async function pollDriverOrderStatuses(): Promise<void> {
  const vpsUrl = (process.env.SERVER_API_URL || "http://localhost:3002").replace(/\/$/, "");
  const vpsUrlSuffix = (process.env.SERVER_API_URL_SUFFIX || "http://localhost:3002").replace(/\/$/, "");
  const secret = process.env.SERVER_SYNC_SECRET || "";
  let offset = 0;
  let appliedCount = 0;

  while (true) {
    const candidates = await db("orders")
      .whereRaw("LOWER(status) = ?", ["out for delivery"])
      .whereNotNull("deliveryPersonId")
      .orderBy("id", "asc")
      .offset(offset)
      .limit(BATCH_SIZE);
    const orderIds = candidates.filter(isDeliveryOrder).map((order: any) => String(order.id));
    if (candidates.length === 0) break;
    offset += candidates.length;
    if (orderIds.length === 0) continue;

    const response = await fetch(`${vpsUrl}/${vpsUrlSuffix}/driver/pos/orders/statuses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ orderIds }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`HTTP ${response.status}: ${detail}`);
    }

    const payload = await response.json() as { orders?: DriverOrderStatus[] };
    if (!Array.isArray(payload.orders) || payload.orders.length === 0) continue;
    const appliedIds = await applyStatusUpdates(payload.orders);
    appliedCount += appliedIds.length;
    const appliedSet = new Set(appliedIds);
    const appliedOrders = payload.orders.filter((order) => appliedSet.has(order.id)).map((order) => ({
      id: order.id,
      status: String(order.status).toLowerCase() === "canceled" ? "cancelled" : String(order.status).toLowerCase(),
      deliveredAt: order.deliveredAt,
      cancelAt: order.cancelAt,
      notes: order.notes,
      isPaid: order.isPaid,
    }));

    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) window.webContents.send("orders-updated-from-sync", appliedOrders);
    }
  }
  if (appliedCount) Logger.info(`DriverOrderStatusSync: applied ${appliedCount} driver status update(s)`);
}

let interval: NodeJS.Timeout | null = null;
let currentRound: Promise<void> | null = null;

export async function processDriverOrderStatusSync(): Promise<void> {
  if (currentRound) return currentRound;
  currentRound = withSyncLock(DRIVER_ORDER_STATUS_SYNC_LOCK, async () => {
    try {
      await pollDriverOrderStatuses();
    } catch (error) {
      Logger.warn("DriverOrderStatusSync: poll failed; eligible orders will be retried:", error);
    }
  }).then(() => undefined).finally(() => { currentRound = null; });
  await currentRound;
}

export function startDriverOrderStatusSync(): void {
  if (interval) return;
  Logger.info(`DriverOrderStatusSync: polling every ${POLL_INTERVAL_MS / 1000}s`);
  processDriverOrderStatusSync().catch((error) => Logger.error("DriverOrderStatusSync: initial poll failed:", error));
  interval = setInterval(() => processDriverOrderStatusSync().catch((error) => Logger.error("DriverOrderStatusSync: poll failed:", error)), POLL_INTERVAL_MS);
}

export async function stopDriverOrderStatusSync(): Promise<void> {
  if (interval) { clearInterval(interval); interval = null; }
  await waitForRound(currentRound);
}
