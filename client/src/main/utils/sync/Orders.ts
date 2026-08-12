import { db } from "../../database/index.js";
import Logger from "electron-log";

/**
 * Push an updated web order's status and details to the VPS v1 API.
 * Called whenever a web order's status or details are updated in the local POS DB.
 */
export async function syncWebOrderToVPS(orderId: string): Promise<void> {
  const vpsUrl = process.env.DRIVER_API_URL || "http://localhost:3002";
  try {
    const order = await db("orders").where({ id: orderId }).first();
    if (!order) return;

    // Only sync web orders
    if (!order.orderType?.toLowerCase()?.includes("web")) return;

    const response = await fetch(`${vpsUrl}/api/v1/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      Logger.error(`WebOrderSync: Failed to sync order ${orderId} to VPS v1: ${response.status} ${response.statusText}`);
    } else {
      Logger.info(`WebOrderSync: Successfully synced order ${orderId} status ('${order.status}') to VPS v1`);
    }
  } catch (err) {
    Logger.error(`WebOrderSync: Error syncing order ${orderId} to VPS:`, err);
  }
}
