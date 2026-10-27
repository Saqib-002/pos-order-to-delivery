import { db } from "./index.js";

// After this many failed print attempts the order is no longer retried and
// staff are told to print it manually (one attempt per sync round, ~10s
// apart: ~50s covers a printer that is briefly off Wi-Fi)
export const MAX_AUTO_PRINT_ATTEMPTS = 5;

// Columns owned by the web-order alert flow. Only this file writes them;
// generic order updates must never touch them (a stale value could reset
// "printed" and cause a reprint).
export const WEB_ORDER_ALERT_COLUMNS = [
  "alertNotifiedAt",
  "autoPrintedAt",
  "autoPrintAttempts",
  "autoPrintLastError",
] as const;

export interface PendingWebOrderAlert {
  order: any;
  items: any[];
  // false when the sound was already played on an earlier (failed-print) round
  needsSound: boolean;
}

export class WebOrderAlertsOperations {
  // Today's web/app orders that are still pending and not printed yet
  // (and haven't used up their print attempts)
  static async getPending(): Promise<PendingWebOrderAlert[]> {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    const orders = await db("orders")
      .where(function () {
        this.where("orderType", "like", "web:%").orWhere("orderType", "like", "app:%");
      })
      .whereRaw(`LOWER("status") = 'pending'`)
      .whereNull("autoPrintedAt")
      .where("autoPrintAttempts", "<", MAX_AUTO_PRINT_ATTEMPTS)
      .where("createdAt", ">=", midnight.toISOString())
      .orderBy("createdAt", "asc");
    if (orders.length === 0) return [];

    const items = await db("order_items").whereIn(
      "orderId",
      orders.map((o) => o.id)
    );
    return orders.map((order) => ({
      order,
      items: items.filter((i) => i.orderId === order.id),
      needsSound: !order.alertNotifiedAt,
    }));
  }

  static async markNotified(orderId: string): Promise<void> {
    await db("orders")
      .where({ id: orderId })
      .whereNull("alertNotifiedAt")
      .update({ alertNotifiedAt: new Date().toISOString() });
  }

  static async markPrinted(orderId: string): Promise<void> {
    await db("orders")
      .where({ id: orderId })
      .update({
        autoPrintedAt: new Date().toISOString(),
        autoPrintLastError: null,
      });
  }

  // Returns the new attempt count, so the caller knows whether it was the last
  static async markPrintFailed(orderId: string, error: string): Promise<number> {
    const [row] = await db("orders")
      .where({ id: orderId })
      .update({
        autoPrintAttempts: db.raw(`COALESCE("autoPrintAttempts", 0) + 1`),
        autoPrintLastError: (error || "Unknown print error").slice(0, 1000),
      })
      .returning(["autoPrintAttempts"]);
    return Number(row?.autoPrintAttempts) || 0;
  }
}
