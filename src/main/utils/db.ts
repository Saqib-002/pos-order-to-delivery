import { Order } from "@/types/order";
import { db } from "../db.js";
import Logger from "electron-log";

export async function renumberDay(day: string) {
  const startkey = `orders:${day}T00:00:00.000Z`;
  const endkey = `orders:${day}T23:59:59.999Z\uffff`;
  
  const result = await db.allDocs({ startkey, endkey, include_docs: true });
  const orders = result.rows.map((row) => row.doc as unknown as Order).filter((doc) => doc && doc.createdAt);  // Filter valid orders
  
  if (orders.length === 0) return;
  
  // Sort by createdAt (ASC), tiebreak by _id (lexicographical)
  orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a._id.localeCompare(b._id));
  
  const updates: Order[] = [];
  orders.forEach((order, index) => {
    const expectedId = index + 1;
    if (order.orderId !== expectedId) {
      order.orderId = expectedId;
      updates.push(order);
    }
  })
  if (updates.length > 0) {
    await db.bulkDocs(updates);
    Logger.info(`Renumbered ${updates.length} orders for day ${day}`);
  }
}