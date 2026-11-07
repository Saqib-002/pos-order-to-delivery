import { db } from "../../database/index.js";
import { enqueueOrderStatus } from "./orderQueue.js";
import { syncLogger as Logger } from "../logger.js";

/**
 * Queue an updated web/app order's status and details for the VPS v1 API.
 * Called whenever a web/app order's status or details change in the POS DB.
 *
 * The update goes into the shared `order_sync_queue` table, so it works from
 * any POS (master or client). The master POS sends it, retrying until the VPS
 * accepts it. Previously each POS used its own local queue file and only the
 * master's was ever sent, so changes made on a client POS were silently lost.
 */
export async function syncWebOrderToVPS(orderId: string): Promise<void> {
  try {
    const order = await db("orders").where({ id: orderId }).first();
    if (!order) return;

    // Only sync web and mobile app orders
    const orderType = order.orderType?.toLowerCase() || "";
    if (!orderType.includes("web") && !orderType.includes("app")) return;

    // deliveryPersonId is deliberately not sent: the VPS orders table has a foreign
    // key to its delivery_persons table, which is no longer filled (the driver
    // sync was removed). Sending an id the VPS doesn't know would fail the update.
    // The driver's name and phone are sent instead, which is what customers see.
    await enqueueOrderStatus(orderId, {
      id: orderId,
      status: String(order.status || "").toLowerCase(),
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
