import { db } from "../../database/index.js";
import { enqueue } from "./queue/index.js";
import Logger from "electron-log";

/**
 * Enqueue an updated web order's status and details to sync to the VPS v1 API.
 * Called whenever a web order's status or details are updated in the local POS DB.
 *
 * Queued (via the offline sync queue) rather than sent immediately, so the
 * update survives being offline and is retried by the background queue
 * processor until it succeeds — previously this was a one-shot fetch that
 * silently and permanently dropped the status change if it failed while
 * offline, with no retry when connectivity returned.
 */
export async function syncWebOrderToVPS(orderId: string): Promise<void> {
  try {
    const order = await db("orders").where({ id: orderId }).first();
    if (!order) return;

    // Only sync web orders
    if (!order.orderType?.toLowerCase()?.includes("web")) return;

    enqueue("orderstatus", "upsert", {
      id: orderId,
      status: order.status,
      deliveryPersonId: order.deliveryPersonId || null,
      deliveryPersonName: order.deliveryPersonName || null,
      deliveryPersonPhone: order.deliveryPersonPhone || null,
      deliveryPersonEmail: order.deliveryPersonEmail || null,
      deliveryPersonVehicleType: order.deliveryPersonVehicleType || null,
      deliveryPersonLicenseNo: order.deliveryPersonLicenseNo || null,
      readyAt: order.readyAt || null,
      assignedAt: order.assignedAt || null,
      deliveredAt: order.deliveredAt || null,
      cancelAt: order.cancelAt || null,
      notes: order.notes || null,
      isPaid: order.isPaid === true,
      paymentType: order.paymentType || null,
    });
  } catch (err) {
    Logger.error(`WebOrderSync: Error queuing order ${orderId} status sync:`, err);
  }
}
